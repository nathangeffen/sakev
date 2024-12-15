import { Move } from "./game.js";

export const RESIGN = -100000;

export type PoolEntry = {
  session: string,
  name: string,
  gameRequested: boolean
};

export type GameDetails = {
  id: number;
  name: string,
  positionId: number,
  specification: string,
  side: string,
  south: string
  north: string
};


export type TransmitMove = {
  gameId: number,
  transmitter: string,
  ply: number,
  move: Move | null
};
