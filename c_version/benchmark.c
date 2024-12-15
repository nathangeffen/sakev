#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "board.h"
#include "position.h"

int main(int argc, char *argv[])
{

  board_t* board = string_to_board((unsigned char *) DEFAULT_POSITION);
  time_t  seconds = time(NULL);
  int n;

  if (argc == 2) {
    n = atoi(argv[1]);
  } else {
    n = 1000000;
  }

  for (int i = 0; i < n; i++) {
    int ret = get_moves(board);
    if (ret) return ret;
  }
  seconds = time(NULL) - seconds;
  printf("Seconds %ld\n", seconds);

  free_board(board);
  return 0;
}
