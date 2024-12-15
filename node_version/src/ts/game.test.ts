import { expect, test } from "vitest";
import {
  fr,
  invFr,
  ROOK,
  DEFAULT_POSITION_STRING,
  TEST_POSITION_STRING,
  loadPosition,
  positionToString,
  Game,
  newGameWithMoves,
  Move,
  move,
  getMoves,
  GameStatus,
  GameOverReason,
} from "./game.js";

test("fr calculates index correctly", () => {
  let index = 0;
  for (let rank = 0; rank < 9; rank++) {
    for (let file = 0; file < 9; file++) {
      expect(fr(9, file, rank)).toStrictEqual(index);
      ++index;
    }
  }
});

test("inverseFr calculates file and rank correctly", () => {
  let index = 0;
  for (let rank = 0; rank < 9; rank++) {
    for (let file = 0; file < 9; file++) {
      expect(invFr(9, index)).toStrictEqual([file, rank]);
      ++index;
    }
  }
});

test("loadPosition works correctly", () => {
  const pos = loadPosition();
  expect(pos.squares[0].piece).toStrictEqual([ROOK, 0]);
});

test("positionToString works correctly", () => {
  const pos = loadPosition();
  const str = positionToString(pos);
  expect(str).toStrictEqual(DEFAULT_POSITION_STRING);
});

test("Moves are correctly calculated - default position", () => {
  const pos = loadPosition();
  const game = new Game(pos);
  const moves = getMoves(game);
  expect(moves.length).toStrictEqual(47);
});


test("Moves are correctly calculated - test position", () => {
  const pos = loadPosition(TEST_POSITION_STRING);
  const game = newGameWithMoves(pos);
  let moves = game.position.moves;
  expect(moves.length).toStrictEqual(3);
  [
    { fromFile: 0, fromRank: 0, toFile: 0, toRank: 1 },
    { fromFile: 0, fromRank: 0, toFile: 0, toRank: 2 },
    { fromFile: 1, fromRank: 0, toFile: 0, toRank: 1 }
  ].forEach((move) => {
    const foundMove = moves.find((key: Move) => {
      return (move.fromFile === key.fromFile && move.fromRank === key.fromRank &&
        move.toFile === key.toFile && move.toRank === key.toRank);
    });
    expect(foundMove == undefined).toEqual(false);
  });
});

test("Game properly played - test position", () => {
  const pos = loadPosition(TEST_POSITION_STRING);
  const game = newGameWithMoves(pos);
  let moves = game.position.moves;
  move(game, { fromFile: 0, fromRank: 0, toFile: 0, toRank: 2 });
  moves = game.position.moves;
  expect(moves.length).toStrictEqual(3);
  move(game, { fromFile: 3, fromRank: 2, toFile: 3, toRank: 0 });
  moves = game.position.moves;
  expect(moves.length).toStrictEqual(1);
  move(game, { fromFile: 1, fromRank: 0, toFile: 0, toRank: 1 });
  move(game, { fromFile: 2, fromRank: 2, toFile: 3, toRank: 1 });
  move(game, { fromFile: 0, fromRank: 1, toFile: 1, toRank: 2 });
  moves = game.position.moves;
  expect(moves.length).toStrictEqual(0);
  expect(game.position.gameStatus).toStrictEqual(GameStatus.South);
  expect(game.position.gameOverReason).toStrictEqual(GameOverReason.PointsScored);
});

