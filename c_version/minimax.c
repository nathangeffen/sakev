#include <stdio.h>
#include <float.h>
#include <threads.h>
#include <sys/param.h>
#include "minimax.h"

#ifdef BENCHMARK
thread_local int evaluations = 0;
thread_local time_t eval_secs = 0;
#endif

static const eval_move_t no_move = {
  0,
  {0,0,0,0}
};

double eval(const board_t *board, int for_side) {
#ifdef BENCHMARK
  evaluations++;
  if (evaluations % BENCHMARK == 0) {
    fprintf(stderr, "Evaluations: %d\tSeconds: %ld\n",
	    evaluations, time(NULL) - eval_secs);
    eval_secs = time(NULL);
  }
#endif
  double score = 0.0;
  if (board->game_ended) {
    if (board->winner - board->side == 0)
      score = 1000.0 + ( (500.0 - board->ply) / 500.0);
    else if (board->winner & board->side) // draw
      score = 0.0 + ( (500.0 - board->ply) / 500.0); // tie
    else
      score = -1000.0 - ( (500.0 - board->ply)  / 500.0); // // North wins
  } else {
    int other_side = (board->side == SOUTH) ? NORTH : SOUTH;
    score = (double)
      (board->current_scores[SI(board->side)] -
       board->current_scores[SI(other_side)]) // score v score
      * 15.0 // This is NB so multiplier needed
      * (board->game_ending ? 2.0 : 1.0) // If game ending, more important
      + (500.0 - board->ply) / 500.0;
    if (board->prev) {
      score += (double)
	board->num_moves / (board->prev->num_moves + 1.0)
	+ (500.0 - board->ply) / 500.0;;
    }
  }
  if (board->side != for_side) {
    score = -score;
  }
  return score;
}

static double minimax_rec(board_t *board, int depth, bool maximizing,
		    int side, bool* error) {
  if (depth == 0 || board->game_ended)
    return eval(board, side);

  double score;
  if (maximizing) {
    score = -DBL_MAX;
    for (int i = 0; i < board->num_moves; i++) {
      board_t* child = make_move(board, board->moves[i]);
      if (child == NULL) {
	*error = true;
	return score;
      }
      double new_score = minimax_rec(child, depth - 1, false, side, error);
      score = MAX(score, new_score);
      free_board_prev(child, board);
    }
    return score;
  } else {
    score = DBL_MAX;
    for (int i = 0; i < board->num_moves; i++) {
      board_t* child = make_move(board, board->moves[i]);
      if (child == NULL) {
	*error = true;
	return score;
      }
      double new_score = minimax_rec(child, depth - 1, false, side, error);
      score = MIN(score, new_score);
      free_board_prev(child, board);
    }
    return score;
  }
}


eval_move_t minimax(board_t *board, int depth, bool* error) {
  #ifdef BENCHMARK
  if (eval_secs == 0) {
    eval_secs = time(NULL);
  }
  #endif
  eval_move_t eval_move = (eval_move_t) {
    -DBL_MAX,
    {0,0,0,0}
  };
  for (int i = 0; i < board->num_moves; i++) {
    board_t *t = make_move(board, board->moves[i]);
    if (t == NULL) {
      *error = true;
      return no_move;
    }
    double e = minimax_rec(t, depth, false, board->side, error);
    free_board_prev(t, board);
    if (*error == true) return no_move;
    if (e > eval_move.eval) {
      eval_move.eval = e;
      eval_move.move = board->moves[i];
    }
  }
  return eval_move;
}
