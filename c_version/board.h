#ifndef BOARD_H
#define BOARD_H

#define PCRE2_CODE_UNIT_WIDTH 8
// #define _GNU_SOURCE
//
#include <stdbool.h>
#include <pcre2.h>

#define EMPTY        0
#define NONE         0
#define SOUTH        1
#define WEST         2
#define NORTH        4
#define EAST         8

#define ANY_SIDE     (SOUTH | WEST | NORTH | EAST)

#define ROOK         16
#define BISHOP       32
#define BLOCK        64

#define SOUTH_BLOCK  (BLOCK | SOUTH)
#define WEST_BLOCK   (BLOCK | WEST)
#define NORTH_BLOCK  (BLOCK | NORTH)
#define EAST_BLOCK   (BLOCK | EAST)

#define ANY_BLOCK    (SOUTH_BLOCK | WEST_BLOCK | NORTH_BLOCK | EAST_BLOCK)


#define SOUTH_BISHOP (SOUTH | BISHOP)
#define SOUTH_ROOK   (SOUTH | ROOK)

#define WEST_BISHOP  (WEST | BISHOP)
#define WEST_ROOK    (WEST | ROOK)

#define NORTH_BISHOP (NORTH | BISHOP)
#define NORTH_ROOK   (NORTH | ROOK)

#define EAST_BISHOP  (EAST | BISHOP)
#define EAST_ROOK    (EAST | ROOK)

#define SOUTH_PIECE  (SOUTH_BISHOP | SOUTH_ROOK)
#define WEST_PIECE   (WEST_BISHOP | WEST_ROOK)
#define NORTH_PIECE  (NORTH_BISHOP | NORTH_ROOK)
#define EAST_PIECE   (EAST_BISHOP | EAST_ROOK)

#define ANY_ROOK     (SOUTH_ROOK | WEST_ROOK | NORTH_ROOK | EAST_ROOK)
#define ANY_BISHOP   (SOUTH_BISHOP | WEST_BISHOP | NORTH_BISHOP | EAST_BISHOP)

#define ANY_PIECE    (SOUTH_PIECE | WEST_PIECE | NORTH_PIECE | EAST_PIECE)

#define SOUTH_SCORE  0
#define WEST_SCORE   1
#define NORTH_SCORE  2
#define EAST_SCORE   3

#define S_V_N        0
#define S_V_N_V_W_E  1
#define S_W_V_N_E    2

#define MAX_PLY 499
#define MAX_MOVES 500
#define MAX_RANKS 10000
#define MAX_FILES 10000

#define RF(rank, file) ( (rank) *  board->files + (file) )
#define RANK_FILE RF
#define FR(file, rank) RF(rank, file)
#define FILE_RANK FR
#define SI(side)       __builtin_ctz(side)
#define SCORE_INDEX SI


#define BOARD_REGEX							\
  "(?<files>[0-9]+)x(?<ranks>[0-9]+)/(?<pieces>[RBSCrbsc_-]*)/"		\
  "(?<blocked>[0-9a-fA-F]*)/(?<scores>[0-9a-fA-F]*)/(?<gametype>[012])/" \
  "(?<ply>[0-9]+)"

#define DEFAULT_POSITION						\
  "9x9/RRBRRRBRR"							\
  "_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_"	\
  "rrbrrrbrr/0000000000F00000F00000000000000000000000F"			\
  "00000000000000000000000F00000F0000000000/00000030001000200030002"	\
  "000100030000000000000000000000000000000000"				\
  "0000000000000000000000000000000000000000000"				\
  "00000000000000000030000000000000000000000000000000000000000000000"	\
  "0000000000000000000000030000000000000000000000000000000000000000"	\
  "0000000000000000000000000000000000000000000000000000000300010002"	\
  "00030002000100030000000/0/0"

#define TEST_POSITION_2_2 "2x2/R_-r/0000/0000000000000000/0/0"

#define TEST_POSITION_3_3a \
  "3x3/-R-_-_-r-/000000000/000000000000000030300000000000000000/0/0"

#define TEST_POSITION_3_3b						\
  "3x3/RR-_-_rr-/000000000/000000000000000030303030000000000000/0/0"

// Game types. There are three types:
// South vs North (0)
// South plus West vs North plus East (1)
// South vs West vs North vs East (2)
// The only difference is how the final score is counted.
#define S_VS_N 0
#define SW_VS_NE 1
#define S_VS_W_VS_N_VS_E 2

#define SHOW_PROMPT 1
#define ALLOW_REPETITION 2

struct move {
  int file_from;
  int rank_from;
  int file_to;
  int rank_to;
};

typedef struct move move_t;

struct eval_move {
  double eval;
  move_t move;
};

typedef struct eval_move eval_move_t;

struct board;
typedef struct board board_t;

struct board {
  int ranks;
  int files;
  int *scores[4];
  int current_scores[4];
  int possible_scores[4];
  int *blocks;
  // Array of possibles moves
  move_t moves[MAX_MOVES];
  int num_moves;
  move_t move;
  int ply;
  int game_type;
  bool game_ending;
  bool game_ended;
  int winner;
  // Keep track of past positions because repetition not allowed
  board_t *prev;
  board_t *next;
  int side;
  bool allow_repetition;
  // Size of squares array
  int size;
  int squares[];
};

extern move_t zero_move;

//prototypes

void substr_regex(pcre2_code *re, const PCRE2_SIZE* ovector,
		  const char *name, char *dest, const char *src);
board_t *init_board(int files, int ranks, unsigned options);
board_t *free_board_prev(board_t *board, const board_t *until);
board_t *free_board_next(board_t *board, const board_t *until);
void free_board(board_t *board);
void print_board(const board_t *board);
void print_move(move_t move);
void print_moves(board_t *board, const char *delim);
void print_game_record(const board_t *board, const char* move_delim,
		       const char *ply_delim,
		       bool numbered, const char *number_delim);
int get_rank(const board_t *board, int square);
int get_file(const board_t *board, int square);
void get_rook_moves(board_t *board, int square);
void get_bishop_moves(board_t *board, int square);
int get_piece_moves(board_t *board, int file, int rank);
int get_moves(board_t *board);
int set_pieces(board_t *board, const char *pieces);
void set_piece(board_t *board, char side, char piece, int file, int rank);
void set_block(board_t *board, const char *side, int file, int rank);
void set_score(board_t *board, const char *side,
	       int score, int file, int rank);
void set_side(board_t *board);
void set_side_char(board_t *board, char side);
void set_ply(board_t *board, int n);
void set_type(board_t *board, char type);
char side_char(const board_t *board);
int side_int(const board_t *board);
board_t* make_move(board_t *board, move_t move);
board_t *pass(board_t *board);
int possible_score(const board_t *board, int side);
int count_score(const board_t *board, int side);
void set_all_scores(board_t *board);
int set_board_situation(board_t *board);
#endif
