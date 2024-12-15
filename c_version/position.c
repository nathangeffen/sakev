#include "position.h"

#define LEN 10000

static const unsigned char *spec = (const unsigned char *) BOARD_REGEX;

static int set_blocked(board_t *board, const char *blocked) {
  int len = (int) strlen(blocked);
  int squares = board->ranks * board->files;

  if ( len > squares)  {
    fprintf(stderr, "Too many blocks given for board.\n");
    return -1;
  }

  if (len < squares) {
    fprintf(stderr, "Warning: Squares %d. %d blocks.\n", squares, len);
  }

  const char *s = blocked;
  for (int i = 0; *s; s++, i++) {
    int j;
    switch (*s) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      j = *s - '0';
      break;
    case 'A':
    case 'B':
    case 'C':
    case 'D':
    case 'E':
    case 'F':
      j = *s - 'A' + 10;
      break;
    case 'a':
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
      j = *s - 'a' + 10;
      break;
    default:
      fprintf(stderr, "Unknown block value %c\n", *s);
      return -1;
    }
    board->blocks[i] = j;
  }
  return 0;
}

static int set_scores(board_t *board, const char *scores) {
  int len = (int) strlen(scores);
  int squares = 4 * board->ranks * board->files;

  if (len > squares)  {
    fprintf(stderr, "Too many scores (%d) given for board (%d).\n", len,
	    squares);
    return -1;
  }

  if (len % 4 != 0) {
    fprintf(stderr, "Scores length is %d but must be divisible by 4.\n",
	    len);
    return -1;
  }

  if (len < squares) {
    fprintf(stderr, "Warning: Squares %d. %d scores.\n", squares, len);
  }

  const char *s = scores;
  for (int i = 0; *s; i++) {
    board->scores[0][i] = *s - '0';
    s++;
    board->scores[1][i] = *s - '0';
    s++;
    board->scores[2][i] = *s - '0';
    s++;
    board->scores[3][i] = *s - '0';
    s++;
  }
  return 0;
}

static void set_game_type(board_t *board, char game_type) {
  board->game_type = game_type - '0';
}

board_t *string_to_board(unsigned char *pos, unsigned options) {
  board_t *board = NULL;

  const size_t spec_size = strlen( (char *) spec);
  /* for pcre2_compile */
  pcre2_code *re;
  PCRE2_SIZE erroffset;
  int errcode;
  PCRE2_UCHAR8 buffer[128];

  /* for pcre2_match */
  int rc;
  PCRE2_SIZE* ovector;

  size_t pos_size = strlen( (char *) pos);
  uint32_t re_opts = 0;

  pcre2_match_data *match_data;
  uint32_t ovecsize = 1024;

  char *subpos = malloc(strlen( (char *) pos) + 1);

  if (subpos == NULL) {
    fprintf(stderr, "Not enough memory: %s %d\n", __FILE__, __LINE__);
    return NULL;
  }

  re = pcre2_compile(spec, spec_size, re_opts, &errcode, &erroffset,
		     NULL);
  if (re == NULL)  {
    pcre2_get_error_message(errcode, buffer, 120);
    fprintf(stderr,"%d\t%s: %s %d\n", errcode, buffer, __FILE__, __LINE__);
    free(subpos);
    return NULL;
  }

  match_data = pcre2_match_data_create(ovecsize, NULL);
  rc = pcre2_match(re, pos, pos_size, 0, re_opts, match_data, NULL);

  if (rc > 0) {
    ovector = pcre2_get_ovector_pointer(match_data);
    // ranks; files
    substr_regex(re, ovector, "files", subpos, (char *) pos);
    int files = atoi(subpos);
    substr_regex(re, ovector, "ranks", subpos, (char *) pos);
    int ranks = atoi(subpos);
    board = init_board(files, ranks, options);
    if (board == NULL) goto error_free;

    // pieces
    substr_regex(re, ovector, "pieces", subpos, (char *) pos);
    if(set_pieces(board, subpos)) {
      free_board(board);
      goto error_free;
    }

    // blocked
    substr_regex(re, ovector, "blocked", subpos, (char *) pos);
    if(set_blocked(board, subpos))  {
      free_board(board);
      goto error_free;
    }

    // scores
    substr_regex(re, ovector, "scores", subpos, (char *) pos);
    if(set_scores(board, subpos)) {
      free_board(board);
      goto error_free;
    }

    // gametype
    substr_regex(re, ovector, "gametype", subpos, (char *) pos);
    set_game_type(board, subpos[0]);

    // number of moves
    substr_regex(re, ovector, "gametype", subpos, (char *) pos);
    set_ply(board, atoi(subpos));
    set_side(board);

  } else if (rc == 0) {
    fprintf(stderr,"offset vector too small: %d",rc);
    free(subpos);
    free_board(board);
    return NULL;

  } else if(rc < 0) {
    fprintf(stderr, "Invalid position: %s %d\n", __FILE__, __LINE__);
    free_board(board);
    return NULL;
  }
  set_board_situation(board);
  set_all_scores(board);
 error_free:
  free(subpos);
  pcre2_match_data_free(match_data);
  pcre2_code_free(re);

  return board;
}

static void print_pieces(const board_t *board, FILE *f) {
  for (int i = 0; i < board->ranks * board->files; i++) {
    switch(board->squares[i]) {
    case SOUTH_ROOK:
      fprintf(f, "R"); break;
    case SOUTH_BISHOP:
      fprintf(f, "B"); break;
    case WEST_ROOK:
      fprintf(f, "S"); break;
    case WEST_BISHOP:
      fprintf(f, "C"); break;
    case NORTH_ROOK:
      fprintf(f, "r"); break;
    case NORTH_BISHOP:
      fprintf(f, "b"); break;
    case EAST_ROOK:
      fprintf(f, "s"); break;
    case EAST_BISHOP:
      fprintf(f, "c"); break;
    case EMPTY:
    default:
      if (i % 2 == 0) {
	fprintf(f, "-"); break;
      } else {
	fprintf(f, "_"); break;
      }
    }
  }
  fprintf(f, "/");
}

static void print_blocked(const board_t *board, FILE *f) {
  for (int i = 0; i < board->ranks * board->files; i++)
      fprintf(f, "%X", board->blocks[i]);
  fprintf(f, "/");
}

static void print_scores(const board_t *board, FILE *f) {
  for (int i = 0; i < board->ranks * board->files; i++)
    for (int j = 0; j < 4; j++ )
      fprintf(f, "%d", board->scores[j][i]);
  fprintf(f, "/");
}

static void print_game_type(const board_t *board, FILE *f) {
  fprintf(f, "%c/", '0' + board->game_type);
}

static void print_ply(const board_t *board, FILE *f) {
  fprintf(f, "%d", board->ply);
}


void output_board(const board_t *board, FILE *f) {

  if (board->ranks <= 0 || board->files <= 0) {
    fprintf(stderr, "Warning: Empty board.\n");
  }

  fprintf(f, "%dx%d/", board->files, board->ranks);
  print_pieces(board, f);
  print_blocked(board, f);
  print_scores(board, f);
  print_game_type(board, f);
  print_ply(board, f);
  fprintf(f, "\n");
}
