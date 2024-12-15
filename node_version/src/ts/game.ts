import { Variation } from "./variation.js";

const MAX_FILES = 100;
const MAX_RANKS = 100;
const REGEX_VERSION = /(?<version>(\d+))/;
const REGEX_FILES = /(?<files>(\d+))/;
const REGEX_RANKS = /(?<ranks>(\d+))/;
const REGEX_FILES_RANKS = new RegExp(
  REGEX_FILES.source + "x" + REGEX_RANKS.source,
);
const REGEX_PIECES = /(?<pieces>([rbRB_x]*))/;
const REGEX_POINTS = /(?<points>(\d*))/;
const REGEX_BLOCKS = /(?<blocks>([_xb]*))/;
const REGEX_SIDE = /(?<side>([ns]))/;
const REGEX_STARTSCORE = /(?<startSouth>(\d+)*)-(?<startNorth>(\d+)*)/;
const REGEX_WINSCORE = /(?<winSouth>(\d+)*)-(?<winNorth>(\d+)*)/;
const REGEX_PLY = /(?<ply>(\d+)*)/;
const REGEX_FROZEN = /(?<frozen>[tf])/;
const REGEX_PLY_LAST_POINTS = /(?<plyLastPoints>(\d+))/;
const REGEX_PLY_TILL_END = /(?<plyTillEnd>(\d+))/;
const REGEX_PLY_COUNT = new RegExp(
  REGEX_PLY_LAST_POINTS.source + "-" + REGEX_PLY_TILL_END.source
);
const REGEX_REPEAT_LAST_MOVE = /(?<noRepeatLastMove>([tf]))/
// const REGEX_MOVES = /(?<moves>((\d+)-(\d+))*)/;

const REGEX_POSITION = new RegExp(
  REGEX_VERSION.source +
  "#" +
  REGEX_FILES_RANKS.source +
  "#" +
  REGEX_PIECES.source +
  "#" +
  REGEX_POINTS.source +
  "#" +
  REGEX_BLOCKS.source +
  "#" +
  REGEX_SIDE.source +
  "#" +
  REGEX_STARTSCORE.source +
  "#" +
  REGEX_WINSCORE.source +
  "#" +
  REGEX_PLY.source +
  "#" +
  REGEX_FROZEN.source +
  "#" +
  REGEX_PLY_COUNT.source +
  '#' +
  REGEX_REPEAT_LAST_MOVE.source
);

// TO DO - parse a game record
// const REGEX_GAME = new RegExp(REGEX_POSITION.source + "#" + REGEX_MOVES.source);

const DEFAULT_VERSION = "1";
const DEFAULT_SIZE = "9x9";
const DEFAULT_PIECES =
  "rrbbrbbrr_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_RRBBRBBRR";
const DEFAULT_POINTS =
  "010102020302020101000000000000000000000000000000000000000000000300000000000000000000000000000000003000000000000000000000000000000000000000000000101020203020201010";
const DEFAULT_BLOCKS =
  "x_x_x_x_x_x_x_x_x_xbx_x_xbx_x_x_x_x_x_x_b_x_x_x_x_x_x_xbx_x_xbx_x_x_x_x_x_x_x_x_x";
const DEFAULT_SIDE = "s";
const DEFAULT_STARTSCORE = "0-1";
const DEFAULT_WINSCORE = "8-8";
const DEFAULT_PLY = "0";
const DEFAULT_FROZEN = "t";
const DEFAULT_PLY_COUNT = "0-32";
const DEFAULT_REPEAT_LAST_MOVE = 'f';
export const DEFAULT_POSITION_STRING =
  DEFAULT_VERSION +
  "#" +
  DEFAULT_SIZE +
  "#" +
  DEFAULT_PIECES +
  "#" +
  DEFAULT_POINTS +
  "#" +
  DEFAULT_BLOCKS +
  "#" +
  DEFAULT_SIDE +
  "#" +
  DEFAULT_STARTSCORE +
  "#" +
  DEFAULT_WINSCORE +
  "#" +
  DEFAULT_PLY +
  "#" +
  DEFAULT_FROZEN +
  "#" +
  DEFAULT_PLY_COUNT +
  "#" +
  DEFAULT_REPEAT_LAST_MOVE;

export const TEST_POSITION_STRING = "1#4x3#rbx_x_x_x_BR#000002010000000010200000#x_x_xbb_x_x_#s#0-0#3-3#0#t#0-4#f";

export const ROOK = 1;
export const BISHOP = 2;
export const SOUTH = 1;
export const NORTH = 2;

const sideIndex = new Map();
sideIndex.set(SOUTH, 0);
sideIndex.set(NORTH, 1);

export const SI = function(side: number) {
  return sideIndex.get(side);
}

export enum GameStatus {
  InPlay = 0,
  South = SOUTH,
  North = NORTH,
  Tie = SOUTH | NORTH,
}

export enum GameOverReason {
  None = 0,
  Agreement,
  Resignation,
  NoMoves,
  PlyWithoutPoints,
  PointsScored
}


export function fr(files: number, file: number, rank: number): number {
  return files * rank + file;
}

export function invFr(files: number, index: number): [number, number] {
  const file = index % files;
  const rank = Math.floor(index / files);
  return [file, rank];
}

class Square {
  index: number;
  piece: [number, number];
  points: [number, number];
  blocked: boolean;

  constructor(
    index: number,
    piece: [number, number] = [0, 0],
    points: [number, number] = [0, 0],
    blocked: boolean = false
  ) {
    this.index = index;
    this.piece = piece;
    this.points = points;
    this.blocked = blocked;
  };
}

export type Move = {
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
};

export const toString = function(move: Move): string {
  let text = "";
  text += String.fromCharCode(97 + move.fromFile);
  text += String(move.fromRank + 1);
  text += '-';
  text += String.fromCharCode(97 + move.toFile);
  text += String(move.toRank + 1);
  return text;
}

type PositionParameters = {
  files: number;
  ranks: number;
  squares: Square[];
  side: number;
  ply: number;
  frozen: boolean;
  startScore: [number, number];
  winScore: [number, number];
  plyLastPoints: number;
  plyTillEnd: number;
  repeatLastMove: boolean;
}

export class Position {
  files: number;
  ranks: number;
  squares: Square[];
  side: number;
  ply: number;
  frozen: boolean;
  score: [number, number];
  startScore: [number, number];
  winScore: [number, number];
  gameStatus: GameStatus;
  gameOverReason: GameOverReason;
  plyLastPoints: number;
  plyTillEnd: number;
  repeatLastMove: boolean;

  moves: Move[];
  move: Move | null;

  constructor(parameters: PositionParameters) {
    this.files = parameters.files || 9;
    this.ranks = parameters.ranks || 9;
    if (parameters.squares.length > 0 &&
      parameters.squares.length != this.files * this.ranks) {
      throw "Mismatch between files, ranks and squares";
    }
    this.squares = [];
    if (parameters.squares.length === 0) {
      for (let rank = 0; rank < parameters.ranks; rank++) {
        for (let file = 0; file < parameters.files; file++) {
          this.squares.push(new Square(fr(parameters.files, file, rank)));
        }
      }
    } else {
      this.squares = parameters.squares;
    }
    this.side = parameters.side || SOUTH;
    this.ply = parameters.ply;
    this.frozen = parameters.frozen;
    this.score = [parameters.startScore[0] || 0, parameters.startScore[1] || 0];
    this.startScore = [parameters.startScore[0] || 0, parameters.startScore[1] || 0];
    this.winScore = parameters.winScore;
    this.gameStatus = GameStatus.InPlay;
    this.gameOverReason = GameOverReason.None;
    this.plyLastPoints = parameters.plyLastPoints;
    this.plyTillEnd = parameters.plyTillEnd;
    this.repeatLastMove = parameters.repeatLastMove;
    this.moves = [];
    this.move = null;
  };

}

export const loadPosition = function(
  positionString = DEFAULT_POSITION_STRING,
): Position {
  let parsed_regex_position: RegExpExecArray | null;
  try {
    parsed_regex_position = REGEX_POSITION.exec(positionString);
  } catch {
    throw `Cannot parse position string: ${positionString}`;
  }
  if (parsed_regex_position === null) {
    throw `Cannot parse position string: ${positionString}`;
  }
  const groups = parsed_regex_position.groups;
  const { files, ranks, pieces, points, blocks, side, startSouth, startNorth,
    winSouth, winNorth, ply, frozen,
    plyLastPoints, plyTillEnd, repeatLastMove } = groups!;
  if (Number(files) > MAX_FILES) {
    throw `Maximum allowed for files is ${MAX_FILES} but ${files} given`;
  }
  if (Number(ranks) > MAX_RANKS) {
    throw `Maximum allowed for files is ${MAX_RANKS} but ${ranks} given`;
  }

  const dim: number = Number(ranks) * Number(files);

  if (pieces.length != dim) {
    throw `Piece string must be exactly ${dim} characters`;
  }
  if (points.length != dim * 2) {
    throw `Points string must be exactly ${dim * 2} characters`;
  }
  if (blocks.length != dim) {
    throw `Blocks string is ${blocks.length} characters but must be exactly ${dim} characters`;
  }
  const squares = [];
  for (let i = 0; i < dim; i++) {
    let piece: [number, number];
    switch (pieces[i]) {
      case "r":
        piece = [ROOK, 0];
        break;
      case "b":
        piece = [BISHOP, 0];
        break;
      case "R":
        piece = [0, ROOK];
        break;
      case "B":
        piece = [0, BISHOP];
        break;
      default:
        piece = [0, 0];
    }
    const point: [number, number] = [Number(points[i * 2]), Number(points[i * 2 + 1])];
    let block: boolean;
    switch (blocks[i]) {
      case "b":
        block = true;
        break;
      default:
        block = false;
    }
    squares.push(new Square(i, piece, point, block));
  }
  return new Position({
    files: Number(files),
    ranks: Number(ranks),
    squares: squares,
    side: side === "s" ? SOUTH : NORTH,
    ply: Number(ply),
    frozen: frozen === "t" ? true : false,
    startScore: [Number(startSouth), Number(startNorth)],
    winScore: [Number(winSouth), Number(winNorth)],
    plyLastPoints: Number(plyLastPoints),
    plyTillEnd: Number(plyTillEnd),
    repeatLastMove: repeatLastMove === "t" ? true : false
  });
};

export const loadEmptyPosition = function(files: number, ranks: number) {
  const squares = [];
  for (let i = 0; i < files * ranks; i++) {
    squares.push(new Square(i, [0, 0], [0, 0], false));
  }
  return new Position({
    files,
    ranks,
    squares,
    side: SOUTH,
    ply: 0,
    frozen: true,
    startScore: [0, 0],
    winScore: [3, 3],
    plyLastPoints: 0,
    plyTillEnd: 16,
    repeatLastMove: false
  });
}

export const positionToString = function(position: Position) {
  let positionString = "1#";
  positionString += position.files + "x" + position.ranks + "#";
  for (const [index, square] of position.squares.entries()) {
    const piece = square.piece[0] + square.piece[1];
    switch (piece) {
      case 0:
        positionString += index % 2 == 0 ? "x" : "_";
        break;
      case ROOK:
        positionString += square.piece[0] == 0 ? "R" : "r";
        break;
      case BISHOP:
        positionString += square.piece[0] == 0 ? "B" : "b";
        break;
    }
  }

  positionString += "#";

  for (const square of position.squares) {
    positionString += square.points[0].toString() + square.points[1].toString();
  }

  positionString += "#";

  for (const [index, square] of position.squares.entries()) {
    const blocked = square.blocked;
    if (blocked === false) {
      positionString += index % 2 === 0 ? "x" : "_";
    } else {
      positionString += "b";
    }
  }
  positionString += "#";

  positionString += position.side == SOUTH ? "s" : "n";
  positionString += "#";

  positionString += position.startScore[0].toString();
  positionString += "-";
  positionString += position.startScore[1].toString();
  positionString += "#";

  positionString += position.winScore[0].toString();
  positionString += "-";
  positionString += position.winScore[1].toString();
  positionString += "#";

  positionString += position.ply.toString();
  positionString += "#";

  positionString += position.frozen ? "t" : "f";
  positionString += "#";

  positionString += position.plyLastPoints + "-" + position.plyTillEnd.toString();
  positionString += '#';

  positionString += (position.repeatLastMove === false) ? 'f' : 't';
  return positionString;
};

export class Game {
  position: Position;
  history: Variation<Position>;
  constructor(position: Position) {
    const node = new Variation<Position>(structuredClone(position));
    this.position = position;
    this.history = node;
  };
};

type Directions = [number, number][];

const ROOK_DIRECTIONS: Directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRECTIONS: Directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const getPieceMoves = function(game: Game, square: Square, directions: Directions): Move[] {
  const moves: Move[] = [];
  if (game.position.frozen === true) {
    const side = game.position.side;
    if (square.points[SI(side)] > 0) {
      return moves;
    }
  }
  const [file, rank] = invFr(game.position.files, square.index);
  for (const direction of directions) {
    let toFile = file + direction[0];
    let toRank = rank + direction[1];
    let blocked = false;
    while (blocked === false &&
      toFile < game.position.files && toRank < game.position.ranks &&
      toFile >= 0 && toRank >= 0) {
      const index = fr(game.position.files, toFile, toRank);
      const toSquare = game.position.squares[index];
      const toPiece = toSquare.piece[0] | toSquare.piece[1];
      const toBlock = toSquare.blocked;
      if (toPiece || toBlock) {
        blocked = true;
      } else {
        moves.push({
          fromFile: file, fromRank: rank,
          toFile: toFile, toRank: toRank
        });
      };
      toFile += direction[0];
      toRank += direction[1];
    }
  }
  return moves;
}

// Even though moves are associated with a position, the function
// expects a game as its parameter. This is in case we want to implement
// rules limiting moves in the case of position repetition.
export const getMoves = function(game: Game): Move[] {

  const removeRepeatedMove = function(moves: Move[]) {
    let history: Variation<Position> | null = game.history;
    if (history && history.value.move) {
      const previousMove = history.value.move;
      const move: Move = {
        fromFile: previousMove.toFile,
        fromRank: previousMove.toRank,
        toFile: previousMove.fromFile,
        toRank: previousMove.fromRank,
      };
      let index = 0;
      for (const m of moves) {
        if (move.fromFile === m.fromFile && move.fromRank === m.fromRank &&
          move.toFile === m.toFile && move.toRank === m.toRank) {
          break;
        }
        index++;
      }
      if (index != moves.length) {
        moves.splice(index, 1);
      }
    }
  }

  let moves: Move[] = [];
  if (game.position.gameStatus === GameStatus.InPlay) {
    const side = game.position.side;
    for (const square of game.position.squares) {
      const piece = square.piece[SI(side)];
      if (piece === ROOK) {
        moves.push(...getPieceMoves(game, square, ROOK_DIRECTIONS));
      } else if (piece === BISHOP) {
        moves.push(...getPieceMoves(game, square, BISHOP_DIRECTIONS));
      }
    }
  }
  if (game.position.repeatLastMove === false) {
    removeRepeatedMove(moves);
  }
  return moves;
};

export const newGameWithMoves = function(position: Position): Game {
  const game = new Game(position);
  game.position.moves = getMoves(game);
  [game.position.gameStatus,
  game.position.gameOverReason,
  game.position.moves] = checkGameStatus(game, game.position.side);
  return game;
}

const moveSquares = function(position: Position, move: Move) {
  const side = position.side;
  const files = position.files;
  const fromIndex = fr(files, move.fromFile, move.fromRank);
  const toIndex = fr(files, move.toFile, move.toRank);
  position.squares[toIndex].piece[SI(side)] = position.squares[fromIndex].piece[SI(side)];
  position.squares[fromIndex].piece[SI(side)] = 0;
};

const calcScore = function(position: Position, side: number): number {
  const squares = position.squares;
  if (position.frozen) {
    let total = position.startScore[SI(side)];
    squares.forEach((square: Square) => {
      if (square.piece[SI(side)]) {
        total += square.points[SI(side)];
      }
    });
    return total;
  } else {
    throw "Points calc for non-frozen positions not implemented yet";
  }
}


const checkGameStatus = function(game: Game, side: number):
  [GameStatus, GameOverReason, Move[]] {
  const position = game.position;
  let moves = position.moves;
  let reason = GameOverReason.None;
  const getResult = function() {
    const score = position.score;
    moves = [];
    return (score[0] === score[1]) ? GameStatus.Tie : (
      (score[0] > score[1]) ? GameStatus.South : GameStatus.North
    );
  }

  const checkIfGameFinishedBecauseNoMoves = function() {
    const result = (position.moves.length === 0) ? true : false;
    if (result) reason = GameOverReason.NoMoves;
    return result;
  }

  const checkIfGameFinishedBecauseWinningScore = function() {
    const score = position.score[SI(side)];
    const result = (score >= position.winScore[SI(side)]) ? true : false;
    if (result) reason = GameOverReason.PointsScored;
    return result;
  }

  const checkIfGameFinishedBecauseOfPlyCount = function() {
    const result = (position.ply - position.plyLastPoints >= position.plyTillEnd) ?
      true : false;
    if (result) reason = GameOverReason.PlyWithoutPoints;
    return result;
  }

  return (
    checkIfGameFinishedBecauseNoMoves() ||
    checkIfGameFinishedBecauseWinningScore() ||
    checkIfGameFinishedBecauseOfPlyCount()
  ) ? [getResult(), reason, moves] :
    [GameStatus.InPlay, GameOverReason.None, moves];
}

export const move = function(game: Game, move: Move) {
  const position = game.position;
  const foundMove = position.moves.find((key: Move) =>
  (move.fromFile === key.fromFile && move.fromRank === key.fromRank &&
    move.toFile === key.toFile && move.toRank === key.toRank));
  if (!foundMove) {
    throw {
      name: "InvalidMoveError",
      message: `${move.fromFile}.${move.fromRank}-${move.toFile}.${move.toRank} not found.`,
    };
  }
  moveSquares(position, foundMove);
  position.move = move;
  position.ply += 1;
  const oldScore = position.score[0] + position.score[1];
  position.score[SI(position.side)] = calcScore(position, position.side);
  if (position.score[0] + position.score[1] > oldScore) {
    position.plyLastPoints = position.ply;
  }
  const side = position.side; // checkGameStatus must be called with the side that's just moved
  position.side = (SOUTH | NORTH) ^ position.side;
  position.moves = getMoves(game); // Moves must be generated before checkGameStatus is called
  [position.gameStatus, position.gameOverReason, position.moves] = checkGameStatus(game, side);
  game.history = game.history.appendChild(structuredClone(position));
}
