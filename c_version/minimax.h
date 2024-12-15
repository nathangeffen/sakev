#ifndef MINIMAX_H
#define MINIMAX_H

#include "board.h"

double eval(const board_t *board, int side);
eval_move_t minimax(board_t *board, int depth, bool* error);

#endif
