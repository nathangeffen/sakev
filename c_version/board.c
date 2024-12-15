#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <threads.h>

#include "board.h"

static const char *game_descriptions[] =  {
  "S v N",
  "S & W v N & E",
  "S v W v N v E"
};


// useful utility function
void substr_regex(pcre2_code *re, const PCRE2_SIZE* ovector,
                  const char *name, char *dest, const char *src)
{
  int i = pcre2_substring_number_from_name(re, (PCRE2_SPTR) name);
  int start = ovector[2 * i];
  int end = ovector[2 * i + 1];
  strncpy(dest, src + start, end - start);
  dest[end - start] = 0;
}

bool check_if_end(const board_t* board) {
  if (board->game_ending && board->side == SOUTH)
    return true;
  return false;
}

bool check_if_ending(const board_t *board) {
  if (memcmp(&board->moves[0], &zero_move, sizeof(zero_move)) == 0
    || board->ply > MAX_PLY)
    return true;
  return false;
}

int possible_score(const board_t *board, int side)
{
  int score = 0;
  int c = SI(side);
  for (int i = 0; i < board->files * board->ranks; i++) {
    if (board->scores[c][i] != 0) {
      if (board->squares[i] == 0) {
        score += board->scores[c][i];
      } else {
        int  s = board->squares[i] & ANY_SIDE;
        if (board->scores[SI(s)][i] == 0) {
          score += board->scores[c][i];
        }
      }
    }
  }
  return score;
}

int count_score(const board_t *board, int side)
{
  int score = 0;
  int n = board->files * board->ranks;
  int c = SI(side);
  const int *sc = board->scores[c];
  const int *sq = board->squares;
  for (int i = 0; i < n; i++, sc++, sq++) {
    if (*sc && (*sq & side)) {
      score += *sc;
    }
  }
  return score;
}

void set_scores(board_t *board) {
  board->current_scores[SI(board->side)] =
    count_score(board, board->side);
  if (board->game_type != S_V_N) {
    for (int i = 0; i < 4; i++) {
      board->possible_scores[i] =
        possible_score(board, 1 << i);
      if (board->possible_scores[i] == 0) {
        board->game_ending = true;
      }
    }
  } else {
    for (int i = 0; i < 4; i+=2) {
      board->possible_scores[i] =
        possible_score(board, 1 << i);
      if (board->possible_scores[i] == 0) {
        board->game_ending = true;
      }
    }
  }
}

void set_all_scores(board_t *board) {
  for (int i = 0; i < 4; i++) {
    int side = 1 << i;
    board->current_scores[SI(side)] = count_score(board, side);
    board->possible_scores[SI(side)] = possible_score(board, side);
  }
}

static int high_score(const int scores[4]) {
  int highest = -100000;
  for (int i = 0; i < 4; i++) {
    if (scores[i] > highest) highest = scores[i];
  }
  return highest;
}

void set_winner(board_t *board) {
  if (board->game_type == S_V_N) {
    board->winner = (board->current_scores[SI(SOUTH)] ==
      board->current_scores[SI(NORTH)]) ? SOUTH | NORTH
      : (board->current_scores[SI(SOUTH)] > board->current_scores[SI(NORTH)])
      ? SOUTH : NORTH;
  } else if (board->game_type == S_V_N_V_W_E) {
    int highest = high_score(board->current_scores);
    for (int i = 0; i  < 4; i++) {
      if (board->current_scores[i] == highest) {
        board->winner |= 1 << i;
      }
    }
  } else {
    int s_w = board->current_scores[SI(SOUTH)] + board->current_scores[SI(WEST)];
    int n_e = board->current_scores[SI(NORTH)] + board->current_scores[SI(EAST)];
    board->winner = (s_w == n_e) ? SOUTH | WEST | NORTH | EAST :
      (s_w > n_e) ? SOUTH | WEST : NORTH | EAST;
  }
}

int set_board_situation(board_t *board) {
  set_side(board);
  if (board->game_ending == true) {
    board->game_ended = check_if_end(board);
    if (board->game_ended) {
      set_winner(board);
    }
  }
  if (board->game_ended == false) {
    int ret = get_moves(board);
    if (ret) return ret;
    if (board->game_ending == false) {
      board->game_ending = check_if_ending(board);
    }
  } else {
    board->num_moves = 0;
  }
  return 0;
}

thread_local board_t *temp_board = NULL;

board_t *init_board(int files, int ranks, unsigned options) {
  // Initialize all to 0
  int c = 0;
  board_t *board;
  void *to_free[7] = {0};
  bool err = false;

  int size = sizeof(*board) + files * ranks * sizeof(board->squares[0]);

  board = calloc(1, size);
  board->size = size;

  if (temp_board != NULL) free(temp_board);

  temp_board = calloc(1, size);
  temp_board->size = size;

  if (board == NULL) {
    fprintf(stderr, "Cannot allocate board.");
    err = true;
    goto clean;
  } else {
    to_free[c++] = board;
  }

  board->files = files;
  board->ranks = ranks;

  // Calloc for blocked squares
  board->blocks = calloc(ranks * files, sizeof(*board->blocks));
  if (board->blocks == NULL) {
    fprintf(stderr, "Cannot allocate board blocked squares.");
    err = true;
    goto clean;
  } else {
    to_free[c++] = board->blocks;
  }

  // Calloc space for scores
  assert(sizeof(*board->scores[0]) == sizeof(int));
  for (int i = 0; i < 4; i++) {
    board->scores[i] = calloc(ranks * files, sizeof(*board->scores[i]));
    if (board->scores[i] == NULL) {
      fprintf(stderr, "Cannot allocate board scores.");
      err = true;
      goto clean;
    } else {
      to_free[c++] = board->scores[i];
    }
  }

  set_side(board);
  board->allow_repetition = (options & ALLOW_REPETITION) ? true : false;

clean:
  if (err) {
    for(int i = 0; to_free[i] != NULL; i++) {
      free(to_free[i]);
    }
    return NULL;
  }
  return board;
}

board_t *free_board_prev(board_t *board, const board_t *until)
{
  board_t *curr = board;
  while(curr != until) {
    board_t *saved = curr;
    curr = curr->prev;
    free(saved);
  }
  if (curr) curr->next = NULL;
  return curr;
}

board_t *free_board_next(board_t *board, const board_t *until)
{
  board_t *curr = board;
  while(curr != until) {
    board_t *saved = curr;
    curr = curr->next;
    free(saved);
  }
  if (curr) curr->prev = NULL;
  return curr;
}

void free_board(board_t *board) {
  free_board_prev(board->prev, NULL);
  free_board_next(board->next, NULL);
  free(board->blocks);
  for (int i = 0; i < 4; i++)
    free(board->scores[i]);
  free(board);
  free(temp_board);
  temp_board = NULL;
}

static void print_square(const board_t *board, int rank, int file,
                         int side) {
  int square = board->squares[FR(file, rank)];
  int block = board->blocks[FR(file, rank)];
  if ( (square & ROOK) && (square & side) ) {
    putchar('R');
  } else if ( (square & BISHOP) && (square & side) ) {
    putchar('B');
  } else  if (block & side) {
    putchar('X');
  } else {
    putchar('_');
  }
  printf("%d", board->scores[SI(side)][FR(file, rank)]);
}

char side_char(const board_t *board)
{
  switch(board->side) {
    case SOUTH: return 'S';
    case WEST: return 'W';
    case NORTH: return 'N';
    case EAST: return 'E';
    default: return 'X'; // Shouldn't happen
  };
}

void set_side(board_t *board)
{
  if (board->game_type == S_V_N)
    board->side = (board->ply % 2 == 0) ? SOUTH : NORTH;
  else
    board->side = 1 << board->ply % 4;
}


bool board_equal(const board_t* a, const board_t *b)
{
  if (a->side == b->side &&
    memcmp(a->squares, b->squares, sizeof(a->squares[0]) *
           a->files * a->ranks) == 0) {
    return true;
  }
  return false;
}

void print_board(const board_t* board) {
  for (int i = board->ranks - 1; i >= 0; i--) {
    int side = NONE;
    while (side != SOUTH) {
      switch (side) {
        case NONE:
          side = NORTH;
        break;
        case NORTH:
          side = WEST;
        break;
        case WEST:
        case EAST:
          side = SOUTH;
        break;
      }
      for (int j = 0; j < board->files; j++) {
        switch (side) {
          case NORTH:
          case SOUTH:
            printf("      ");
            print_square(board, i, j, side);
            printf("  ");
          break;
          default: // We're in West
            printf("    ");
            print_square(board, i, j, side);
            printf("  ");
            side = EAST;
            print_square(board, i, j, side);
            side = WEST;
        }
        if (j == board->files - 1 && side == WEST) {
          printf("  %d", i);
        }
      }
      puts("");
    }
    puts("");
  }
  printf("       ");
  for (int i = 0; i < board->files; i++) {
    int c = printf("%d", i);
    printf("%*s", 10-c, "");
  }
  printf("\nTo play: %c \t Game type: %s \t Ply: %d \t Ending? %d \t"
         "Ended %d \t ",
         side_char(board), game_descriptions[board->game_type], board->ply,
         board->game_ending, board->game_ended);
  if (board->game_type == S_V_N) {
    printf("S: %d|%d N: %d|%d",
           board->current_scores[0], board->possible_scores[0],
           board->current_scores[2], board->possible_scores[2]);
  } else {
    printf("S: %d/%d W: %d/%d N: %d/%d E: %d/%d",
           board->current_scores[0], board->possible_scores[0],
           board->current_scores[0], board->possible_scores[1],
           board->current_scores[2], board->possible_scores[2],
           board->current_scores[3], board->possible_scores[3]);
  }
  if (board->game_ended) {
    printf("\tWinners: ");
    if (board->winner & SOUTH) putchar('S');
    if (board->winner & WEST) putchar('W');
    if (board->winner & NORTH) putchar('N');
    if (board->winner & EAST) putchar('E');
  }
  puts("");
}

void print_move(move_t move)
{
  printf("%d,%d-%d,%d",
         move.file_from,
         move.rank_from,
         move.file_to,
         move.rank_to);
}

void print_moves(board_t *board, const char *delim)
{
  printf("%d possible moves\n", board->num_moves);
  for (int i  = 0; i < board->num_moves; i++) {
    print_move(board->moves[i]);
    printf("%s", delim);
  }
  puts("");
}

void print_game_record(const board_t *board, const char* move_delim,
                       const char *ply_delim,
                       bool numbered, const char *number_delim) {
  const board_t *curr = board;
  while (curr->prev) {
    curr = curr->prev;
  }

  if (curr->next && curr->game_type == S_V_N && curr->side != SOUTH) {
    printf(" ... %s", ply_delim);
  } else {
    switch(curr->game_type) {
      case WEST:
        printf(" ... %s", ply_delim);
      case NORTH:
        printf(" ... %s", ply_delim);
      case EAST:
        printf(" ... %s", ply_delim);
    }
  }

  while (curr != board) {
    if (memcmp(&curr->move, &zero_move, sizeof(zero_move)) != 0) {
      if (curr->side == SOUTH) {
        if (numbered) {
          if (curr->game_type == S_V_N) {
            printf("%d%s", curr->ply / 2 + 1, number_delim);
        } else {
            printf("%d%s", curr->ply / 4 + 1, number_delim);
          }
        }
      }
      print_move(curr->move);
      printf("%s", ply_delim);
      if (curr->next == board || curr->next->side == SOUTH) {
        printf("%s", move_delim);
      }
    }
    curr = curr->next;
  }
}


int get_rank(const board_t *board, int square) {
  return square / board->files;
}

int get_file(const board_t *board, int square) {
  return square % board->ranks;
}


void phantom_move_static(board_t *board, const move_t move) {
  int space = sizeof(*board) +
    board->files * board->ranks * sizeof(board->squares[0]);
  memcpy(temp_board, board, space);
  temp_board->squares[FR(move.file_to, move.rank_to)] =
    temp_board->squares[FR(move.file_from, move.rank_from)];
  temp_board->squares[FR(move.file_from, move.rank_from)] = 0;
  set_scores(temp_board);
  temp_board->ply++;
  board->move = move;
  // temp_board->move = zero_move;
  set_side(temp_board);
}

board_t *phantom_move(board_t *board, const move_t move) {
  board_t *new_board = calloc(1, board->size);
  if (new_board == NULL) {
    fprintf(stderr, "Out of memory allocating board at %s %d.\n",
            __FILE__, __LINE__);
    return NULL;
  }
  memcpy(new_board, board, board->size);
  new_board->squares[FR(move.file_to, move.rank_to)] =
    new_board->squares[FR(move.file_from, move.rank_from)];
  new_board->squares[FR(move.file_from, move.rank_from)] = 0;
  set_scores(new_board);
  new_board->ply++;
  board->move = move;
  // new_board->move = zero_move;
  set_side(new_board);
  return new_board;
}

bool check_repetition(const board_t *old, const board_t* new) {
  const board_t *curr = old;
  while (curr) {
    if (board_equal(curr, new)) return true;
    curr = curr->prev;
  }
  return false;
}

const static int rook_directions[] = {
  0, -1,
  -1, 0,
  0, 1,
  1, 0
};

const static int bishop_directions[] = {
  1, -1,
  1, 1,
  -1, -1,
  -1, 1
};


int get_piece_moves(board_t *board, int rank, int file)
{
  const int *direction;
  if (board->squares[RF(rank, file)] & ROOK) {
    direction = rook_directions;
  } else {
    direction = bishop_directions;
  }
  for (int i = 0; i < 4; i++) {
    bool blocked = false;
    const int rank_jump = direction[i * 2];
    const int file_jump = direction[i * 2 + 1];
    int r = rank + rank_jump;
    int f = file + file_jump;
    while (r >= 0 && r < board->ranks &&
      f >= 0 && f < board->files &&
      blocked == false) {
      if ( (board->squares[FR(f, r)] == EMPTY) &&
        ( (board->blocks[FR(f, r)] & board->side) == NONE) ) {
        if (board->num_moves >= MAX_MOVES) {
          fprintf(stderr, "Too many possible moves");
          exit(EXIT_FAILURE);
        }

        move_t m;
        m.file_from = file;
        m.rank_from = rank;
        m.file_to = f;
        m.rank_to = r;

        if (board->allow_repetition == false) {
          phantom_move_static(board, m);
          if ( (check_repetition(board->prev, temp_board) == false) )
            board->moves[board->num_moves++] = m;
        } else {
          board->moves[board->num_moves++] = m;
        }
        r += rank_jump;
        f += file_jump;
      } else {
        blocked = true;
      }
    }
  }
  return 0;
}

int get_moves(board_t *board) {
  board->num_moves = 0;
  if (board->game_ended == false) {
    for (int i = 0; i < board->ranks; i++) {
      for (int j = 0; j < board->files; j++) {
        if ( (board->squares[RF(i,j)] & board->side) &&
          (board->squares[RF(i,j)] & (ROOK | BISHOP) ) &&
          (board->scores[SI(board->side)][RF(i,j)] == 0) ) {
          int ret = get_piece_moves(board, i, j);
        if (ret) return ret;
        }
      }
    }
    // If no moves then pass is the only option
    if (board->num_moves == 0) {
      board->moves[0] = zero_move;
      board->num_moves = 1;
    }
  }
  return 0;
}

board_t *finish_move(board_t *board, move_t move) {
  board_t *try_board = phantom_move(board, move);
  if (try_board == NULL) {
    return NULL;
  }
  set_board_situation(try_board);
  board->next = try_board;
  try_board->prev = board;
  return try_board;
}

board_t *make_move(board_t *board, move_t move) {
  if (board->num_moves == 0 && board->game_ended == false &&
    memcmp(&move, &zero_move, sizeof(move)) == 0) {
    return pass(board);
  } else {
    bool found = false;
    for (int i = 0; i < board->num_moves; i++) {
      if (memcmp(&move, &board->moves[i], sizeof(move)) == 0) {
        found = true;
        break;
      }
    }
    if (found == false) {
      fprintf(stderr, "Move %d,%d-%d,%d not found\n",
              move.file_from,
              move.rank_from,
              move.file_to,
              move.rank_to);
      return board;
    }
    return finish_move(board, move);
  }
}

board_t *pass(board_t *board) {
  if (board->game_ended) {
    fprintf(stderr, "You cannot pass because the game is over.\n");
    return board;
  }

  if (memcmp(&board->moves[0], &zero_move, sizeof(zero_move)) != 0 ) {
    fprintf(stderr, "You cannot pass if you can legally move.\n");
    return board;
  }

  return finish_move(board, board->moves[0]);
}

void set_piece(board_t *board, char side, char piece, int file, int rank)
{
  if (rank >= board->ranks || rank < 0 ||
    file >= board->files || file < 0) {
    fprintf(stderr, "Square (%d, %d) out of bounds in board "
            "with dimensions %dx%d.\n",
            file, rank, board->ranks, board->files);
    return;
  }
  switch (side) {
    case 's':
    case 'S':
      if (piece == 'r')
        board->squares[FR(file, rank)] = SOUTH_ROOK;
      else if (piece == 'b')
        board->squares[FR(file, rank)] = SOUTH_BISHOP;
      else
        board->squares[FR(file, rank)] = NONE;
      break;
    case 'w':
    case 'W':
      if (piece == 'r')
        board->squares[FR(file, rank)] = WEST_ROOK;
      else if (piece == 'b')
        board->squares[FR(file, rank)] = WEST_BISHOP;
      else
        board->squares[FR(file, rank)] = NONE;
      break;
    case 'e':
    case 'E':
      if (piece == 'r')
        board->squares[FR(file, rank)] = EAST_ROOK;
      else if (piece == 'b')
        board->squares[FR(file, rank)] = EAST_BISHOP;
      else
        board->squares[FR(file, rank)] = NONE;
      break;
    case 'n':
    case 'N':
      if (piece == 'r')
        board->squares[FR(file, rank)] = NORTH_ROOK;
      else if (piece == 'b')
        board->squares[FR(file, rank)] = NORTH_BISHOP;
      else
        board->squares[FR(file, rank)] = NONE;
      break;
  }
}

int set_pieces(board_t *board, const char *pieces) {
  int len = (int) strlen(pieces);
  int squares = board->ranks * board->files;

  if (len > squares)  {
    fprintf(stderr, "Too many squares (%d) given for board (%d).\n", len,
            squares);
    return -1;
  }

  if (len < squares) {
    fprintf(stderr, "Warning: Squares %d. %d provided.\n", squares, len);
  }

  const char *s = pieces;
  for (int i = 0; *s; s++, i++) {
    switch (*s) {
      case '_':
      case '-':
        board->squares[i] = EMPTY;
      break;
      case 'R':
        board->squares[i] = SOUTH_ROOK;
      break;
      case 'B':
        board->squares[i] = SOUTH_BISHOP;
      break;
      case 'S':
        board->squares[i] = WEST_ROOK;
      break;
      case 'C':
        board->squares[i] = WEST_BISHOP;
      break;
      case 'r':
        board->squares[i] = NORTH_ROOK;
      break;
      case 'b':
        board->squares[i] = NORTH_BISHOP;
      break;
      case 's':
        board->squares[i] = EAST_ROOK;
      break;
      case 'c':
        board->squares[i] = EAST_BISHOP;
      break;
      default:
        fprintf(stderr, "Unknown piece %c\n", *s);
        return -1;
    }
  }

  return 0;
}

void set_block(board_t *board, const char *side, int file, int rank)
{
  if (rank >= board->ranks || rank < 0 ||
    file >= board->files || file < 0) {
    fprintf(stderr, "Square (%d, %d) out of bounds in board "
            "with dimensions %dx%d.\n",
            file, rank, board->ranks, board->files);
    return;
  }
  // board->squares[FR(file, rank)]  = 0;
  if (side[0] == 'x') {
    board->blocks[FR(file, rank)]  = 0;
    return;
  }

  for (const char *s = side; *s != 0; s++) {
    switch (*s) {
      case 's':
      case 'S':
        board->blocks[FR(file, rank)] |= SOUTH;
      break;
      case 'w':
      case 'W':
        board->blocks[FR(file, rank)] |= WEST;
      break;
      case 'e':
      case 'E':
        board->blocks[FR(file, rank)] |= EAST;
      break;
      case 'n':
      case 'N':
        board->blocks[FR(file, rank)] |= NORTH;
      break;
    }
  }
}

void set_score(board_t *board, const char *side,
               int score, int file, int rank)
{
  if (rank >= board->ranks || rank < 0 ||
    file >= board->files || file < 0) {
    fprintf(stderr, "Square (%d, %d) out of bounds in board "
            "with dimensions %dx%d.\n",
            file, rank, board->ranks, board->files);
    return;
  }
  for (const char *s = side; *s != 0; s++) {
    switch (*s) {
      case 's':
      case 'S':
        board->scores[SOUTH_SCORE][FR(file, rank)] = score;
      break;
      case 'w':
      case 'W':
        board->scores[WEST_SCORE][FR(file, rank)] = score;
      break;
      case 'n':
      case 'N':
        board->scores[NORTH_SCORE][FR(file, rank)] = score;
      break;
      case 'e':
      case 'E':
        board->scores[EAST_SCORE][FR(file, rank)] = score;
      break;
    }
  }
}

void set_side_char(board_t *board, char side)
{
  switch(side) {
    case 's':
      board->ply = 0;
      break;
    case 'w':
      board->ply = 1; break;
    case 'n':
      board->ply = 2; break;
    case 'e':
      board->ply = 3; break;
  }
  set_side(board);
}

void set_ply(board_t *board, int n)
{
  board->ply = n;
}

void set_type(board_t *board, char type)
{
  switch(type) {
    case '0':
      board->game_type = S_V_N; break;
    case '1':
      board->game_type = S_V_N_V_W_E; break;
    case '2':
      board->game_type = S_W_V_N_E; break;
  }
}
