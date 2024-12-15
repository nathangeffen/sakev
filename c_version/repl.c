#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <readline/readline.h>
#include <readline/history.h>

#include "repl.h"

move_t zero_move = {0, 0, 0, 0};

bool is_blank(const char *str)
{
  for (const char *c = str; *c != 0 && *c != '\n'; c++)
    if (isspace(*c) == false) return false;
  return true;
}

static void clean(const char *str_from, char *str_to)
{
  const char *i = str_from;
  char *j = str_to;

  do  {
    if (*i != ' ' && *i != '\t')
      *j++ = *i;
  } while(*i++ != 0);
}

static void print_help()
{
  puts(" B                                   Show board");
  puts(" M                                   Show all possible moves");
  puts(" p s|w|n|e r|b|x <file>-<rank>       Place a piece");
  puts(" b (s|w|n|e)+  <file>-<rank>         Block a square");
  puts(" u (s|w|n|e)+ <file>-<rank>          Unblock a square");
  puts(" s [swne]+  <score>;<file>-<rank>    Set score to square");
  puts(" i <files>x<ranks>                   Initialize board to dimensions");
  puts(" t s|w|n|e                           Set player turn");
  puts(" n <move_num>                        Set move number");
  puts(" g 0|1|2                             Set game type");
  puts(" l <position>                        Load a position");
  puts(" D                                   Load default position");
  puts(" R                                   Ready to play");
  puts(" o                                   Output position");
  puts(" O                                   Output game record");
  puts(" m <file>-<rank>;<file>-<rank>       Move piece");
  puts(" ! <index>                           Move by index");
  puts(" S <depth> f(don't move)|t(move)>    Suggest move");
  puts(" e                                   Evaluate position");
  puts(" G <num_moves>;<depth>;<sleep>       Engine play itself");
  puts(" x                                   Can't move so pass");
  puts(" j                                   Back one move");
  puts(" k                                   Forward one move");
  puts(" d                                   Dump history to stdout");
  puts(" h                                   Help");
  puts(" q                                   Quit");
}

static const unsigned char *spec = (const unsigned char *)
  "(?<print>^B$)|"
  "(?<moves>^M$)|"
  "(?<setpiece>^p(?<side_p>[nswe])(?<piece_p>[rbx])(?<file_p>[0-9]+)-(?<rank_p>[0-9])+$)|"
  "(?<block>^b(?<side_b>([nswe]{1,4})|x)(?<file_b>[0-9]+)-(?<rank_b>[0-9])+$)|"
  "(?<score>s(?<side_s>[nswe]{1,4})(?<score_s>[0-9]+);(?<file_s>[0-9]+)-(?<rank_s>[0-9])+$)|"
  "(?<init>^i(?<file_i>[0-9]+)x(?<rank_i>[0-9])+$)|"
  "(?<turn>^t(?<side_t>[nswe]))|"
  "(?<move_num>^n(?<num_m>[0-9]+))|"
  "(?<game>^g(?<type>[012]))|"
  "(?<load>l(?<board_regex>" BOARD_REGEX "))|"
  "(?<default>D$)|"
  "(?<ready>^R$)|"
  "(?<move>^m(?<file_from>[0-9]+),(?<rank_from>[0-9]+)-(?<file_to>[0-9]+),(?<rank_to>[0-9]+)$)|"
  "(?<move_index>^!(?<index_m>[0-9]+)$)|"
  "(?<suggest>^S(?<depth>[0-6])(?<move_S>[yntf])$)|"
  "(?<play>^G(?<num_moves>[0-9]+);(?<depth_G>[0-6]);(?<sleep>[0-9]+)$)|"
  "(?<eval>^e$)|"
  "(?<pass>^x$)|"
  "(?<dump>^d$)|"
  "(?<back>^j$)|"
  "(?<forward>^k$)|"
  "(?<ouput_position>^o$)|"
  "(?<ouput_record>^O$)|"
  "(?<help>^h$)|"
  "(?<quit>^q$)";

static int exec_cmd(board_t **board, const char *cmd, bool *cont,
                    pcre2_code *re, PCRE2_SIZE* ovector, unsigned options)
{
  char side[6], piece;
  int file, rank, score;
  char *subcmd = malloc(strlen(cmd) + 1);
  move_t move;

  if (subcmd == 0) {
    fprintf(stderr, "No memory at %s %d\n", __FILE__, __LINE__);
    return -1;
  }
  switch( (char) cmd[0]) {
  case 'B':
    print_board(*board); break;
  case 'M':
    print_moves(*board, " "); break;
  case 'p':
    substr_regex(re, ovector, "side_p", subcmd, cmd);
    side[0] = subcmd[0];
    substr_regex(re, ovector, "piece_p", subcmd, cmd);
    piece = subcmd[0];
    substr_regex(re, ovector, "file_p", subcmd, cmd);
    file = atoi(subcmd);
    substr_regex(re, ovector, "rank_p", subcmd, cmd);
    rank = atoi(subcmd);
    set_piece(*board, side[0], piece, file, rank);
    break;
  case 'b':
    substr_regex(re, ovector, "side_b", subcmd, cmd);
    strncpy(side, subcmd, 5);
    substr_regex(re, ovector, "file_b", subcmd, cmd);
    file = atoi(subcmd);
    substr_regex(re, ovector, "rank_b", subcmd, cmd);
    rank = atoi(subcmd);
    set_block(*board, side, file, rank);
    break;
  case 's':
    substr_regex(re, ovector, "side_s", subcmd, cmd);
    strncpy(side, subcmd, 5);
    substr_regex(re, ovector, "score_s", subcmd, cmd);
    score = atoi(subcmd);
    substr_regex(re, ovector, "file_s", subcmd, cmd);
    file = atoi(subcmd);
    substr_regex(re, ovector, "rank_s", subcmd, cmd);
    rank = atoi(subcmd);
    set_score(*board, side, score, file, rank);
    break;
  case 'i':
    substr_regex(re, ovector, "file_i", subcmd, cmd);
    file = atoi(subcmd);
    substr_regex(re, ovector, "rank_i", subcmd, cmd);
    rank = atoi(subcmd);
    free_board(*board);
    *board = init_board(file, rank, options);
    if (*board == NULL) {
      free(subcmd);
      return -1;
    }
    break;
  case 'e':
    printf("Evaluation: %f\n", eval(*board, (*board)->side));
    break;
  case 't':
    substr_regex(re, ovector, "side_t", subcmd, cmd);
    set_side_char(*board, subcmd[0]);
    break;
  case 'n':
    substr_regex(re, ovector, "num_m", subcmd, cmd);
    set_ply(*board, atoi(subcmd));
    break;
  case 'g':
    substr_regex(re, ovector, "type", subcmd, cmd);
    set_type(*board, subcmd[0]);
    break;
  case 'o':
    output_board(*board, stdout); break;
  case 'O':
    print_game_record(*board, "\n", " ", true, ". "); break;
  case 'l':
    substr_regex(re, ovector, "board_regex", subcmd, cmd);
    free_board(*board);
    *board = string_to_board((unsigned char *) subcmd, options);
    if (*board == NULL) {
      free(subcmd);
      return -1;
    }
    break;
  case 'm':
    {
      substr_regex(re, ovector, "file_from", subcmd, cmd);
      move.file_from = atoi(subcmd);
      substr_regex(re, ovector, "rank_from", subcmd, cmd);
      move.rank_from = atoi(subcmd);
      substr_regex(re, ovector, "file_to", subcmd, cmd);
      move.file_to = atoi(subcmd);
      substr_regex(re, ovector, "rank_to", subcmd, cmd);
      move.rank_to = atoi(subcmd);
      board_t *t = make_move(*board, move);
      if (t == NULL) {
        free(subcmd);
        return -1;
      }
      *board = t;
    }
    break;
  case '!':
    substr_regex(re, ovector, "index_m", subcmd, cmd);
    int index = atoi(subcmd);
    if (index >= (*board)->num_moves) {
      puts("Move out of range");
    } else {
      board_t *t = make_move(*board, (*board)->moves[index]);
      if (t == NULL) {
        free(subcmd);
        return -1;
      }
      *board = t;
    }
    break;
  case 'x':
    *board = pass(*board);
    break;
  case 'S':
    {
      bool err = false;
      int depth;
      substr_regex(re, ovector, "depth", subcmd, cmd);
      depth = atoi(subcmd);
      substr_regex(re, ovector, "move_S", subcmd, cmd);
      eval_move_t m = minimax(*board, depth, &err);
      if (err) {
        printf("An error ocurred.\n");
        return -1;
      }
      printf("Suggested move: ");
      print_move(m.move);
      printf(" Eval: %f\n", m.eval);
      if (subcmd[0] == 'y' || subcmd[0] == 't') {
        board_t *t = make_move(*board, m.move);
        if (t == NULL) {
          free(subcmd);
          return -1;
        }
        *board = t;
      }
      break;
    }
  case 'G':
    {
      bool err = false;
      int num_moves;
      int depth;
      int sleep_time;
      substr_regex(re, ovector, "num_moves", subcmd, cmd);
      num_moves = atoi(subcmd);
      substr_regex(re, ovector, "depth_G", subcmd, cmd);
      depth = atoi(subcmd);
      substr_regex(re, ovector, "sleep", subcmd, cmd);
      sleep_time = atoi(subcmd);
      for (int i = 0; i < num_moves && (*board)->game_ended == false; i++) {
        eval_move_t m = minimax(*board, depth, &err);
        if (err) {
          printf("An error ocurred.\n");
          return -1;
        }
        board_t *t = make_move(*board, m.move);
        if (t == NULL) {
          free(subcmd);
          return -1;
        }
        *board = t;
        if (sleep_time) {
          print_board(*board);
          sleep(sleep_time);
        }
        print_move(m.move);
        puts("");
      }
      break;
    }
  case 'j':
    if ((*board)->prev)
      *board = (*board)->prev;
    break;
  case 'k':
    if ((*board)->next)
      *board = (*board)->next;
    break;
  case 'D':
    free_board(*board);
    *board = string_to_board((unsigned char *) DEFAULT_POSITION, options);
    if (*board == NULL) {
      free(subcmd);
      return -1;
    }
    break;
  case 'R':
    set_board_situation(*board);
    puts("Ready to play");
    break;
  case 'd':
    {
    HIST_ENTRY **the_list;
    the_list = history_list ();
    if (the_list)
      for (int i = 0; the_list[i]; i++)
        printf ("%s\n", the_list[i]->line);
    }
    break;
  case 'h':
    print_help(); break;
  case 'q':
    *cont = false; break;
  default:
    puts("Unrecognised command");
  }
  free(subcmd);
  return 0;
}

int repl(board_t **board, int options)
{
  /* for pcre2_compile */
  pcre2_code *re;
  PCRE2_SIZE erroffset;
  int errcode;
  PCRE2_UCHAR8 buffer[128];

  /* for pcre2_match */
  PCRE2_SIZE* ovector;

  pcre2_match_data *match_data;
  uint32_t ovecsize = 1024;


  //const size_t spec_size = strlen( (char *) spec);

  re = pcre2_compile(spec, PCRE2_ZERO_TERMINATED, 0, &errcode, &erroffset,
                     NULL);
  if (re == NULL)  {
    pcre2_get_error_message(errcode, buffer, 120);
    fprintf(stderr,"%d\t%s: %s %d\n", errcode, buffer, __FILE__, __LINE__);
    return -1;
  }

  match_data = pcre2_match_data_create(ovecsize, NULL);

  bool cont = true;
  using_history();
  do {
    char *cmd, *clean_cmd;
    PCRE2_SPTR subject;
    if (options & SHOW_PROMPT) {
      cmd = readline("> ");
    } else {
      cmd = readline("");
    }

    if (cmd) {
      add_history(cmd);
      clean_cmd = malloc(strlen(cmd) + 1);
      if (clean_cmd == NULL) {
        fprintf(stderr, "Not enough memory: %s %d\n", __FILE__, __LINE__);
        return -1;
      }
      clean(cmd, clean_cmd);
    } else {
      break;
    }

    subject = (PCRE2_SPTR) clean_cmd;
    int rc = pcre2_match(re, subject, strlen(clean_cmd), 0,
                         0, match_data, NULL);

    if (is_blank((char *) subject)) {
      continue;
    } else if (rc == 0) {
      fprintf(stderr,"Error processing command. Error code %d. File %s. Line %d", rc, __FILE__, __LINE__);
    } else if(rc < 0) {
      puts("Unrecognised command");
    } else {
      ovector = pcre2_get_ovector_pointer(match_data);
      exec_cmd(board, (char *) subject, &cont, re, ovector, options);
    }
    free(cmd);
    free(clean_cmd);
  } while (cont);
  pcre2_match_data_free(match_data);
  pcre2_code_free(re);
  return 0;
}
