import {
  SOUTH, NORTH, ROOK, BISHOP, fr, Move,
  move as gameMove,
} from "../game.js";

import {
  GameUX, GameUXState,
  DIV_X_MARGIN, DIV_Y_MARGIN,
  BLOCKED_SQUARE_IMAGE,
  POINTS_SOUTH, POINTS_NORTH,
  SOUTH_ROOK_IMAGE, SOUTH_BISHOP_IMAGE, NORTH_ROOK_IMAGE, NORTH_BISHOP_IMAGE,
  FROZEN_SQUARE_IMAGE
} from "../gameux.js";


const SVGNS = "http://www.w3.org/2000/svg";
const LAST_MOVE_COLOR = 'Yellow';

const EVEN_SQUARE = 'LightGray';
const ODD_SQUARE = 'SlateGray';
const SELECTED_SQUARE = 'DarkCyan';
const TRACER_COLOR = 'DarkSlateBlue';
const SELECTED_SQUARE_COLOR = '#43cb7e';

export class Board {
  squareDim: number = 0;
  squares: SVGElement[] = [];
  gameUX: GameUX;
  svg: SVGElement;
  selectedPiece: [number, number] | null = null;

  constructor(gameUX: GameUX, svg: SVGElement) {
    this.gameUX = gameUX;
    this.svg = svg;
  }

  calcSquareDim = function(
    this: Board,
    width: number,
    height: number,
    files: number,
    ranks: number): number {
    let result: number;
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    if (width <= vh) {
      result = (width - DIV_X_MARGIN) / files;
    } else {
      result = (height - DIV_Y_MARGIN) / ranks;
    }
    const maxSize = (height - DIV_Y_MARGIN) / 6;
    if (result > maxSize) {
      result = maxSize;
    }
    return result;
  }

  setupBlocked = function(this: Board, square: SVGElement) {
    const blocked = document.createElementNS(SVGNS, 'image');
    square.appendChild(blocked);
    blocked.setAttribute('x', String(0));
    blocked.setAttribute('y', String(0));
    blocked.setAttribute('height', String(this.squareDim));
    blocked.setAttribute('width', String(this.squareDim));
    blocked.setAttribute('href', BLOCKED_SQUARE_IMAGE);
  }

  placePoint = function(
    svg: SVGElement,
    points: number,
    fill: string,
    fontSize: number,
    x: number,
    y: number) {
    const pointElement = document.createElementNS(SVGNS, 'text');
    svg.appendChild(pointElement);
    pointElement.style.fontWeight = 'bold';
    pointElement.style.fontSize = String(fontSize) + "px";

    pointElement.setAttribute('x', String(x));
    pointElement.setAttribute('y', String(y));
    pointElement.setAttribute('fill', fill);
    pointElement.textContent = String(points);
  }

  setupPoints = function(this: Board, svg: SVGElement, points: [number, number]) {
    const gameUX = this.gameUX;
    const offset: number = 6;
    const fontSize = this.squareDim / 5.0;
    if (points[0]) {
      if (gameUX.onTop === NORTH) {
        this.placePoint(svg, points[0], POINTS_SOUTH, fontSize, offset, this.squareDim - offset);
      } else {
        this.placePoint(svg, points[0], POINTS_SOUTH, fontSize, offset, fontSize + offset);
      }
    }
    if (points[1]) {
      if (gameUX.onTop === NORTH) {
        this.placePoint(svg, points[1], POINTS_NORTH, fontSize, offset, fontSize + offset);
      } else {
        this.placePoint(svg, points[1], POINTS_NORTH, fontSize, offset, this.squareDim - offset);
      }
    }
  }

  setupSquare = function(this: Board, file: number, rank: number) {
    const svg: SVGElement = document.createElementNS(SVGNS, 'svg');
    const position = this.gameUX.game.position;
    const squareDim = this.squareDim;

    const square: SVGRectElement = document.createElementNS(SVGNS, 'rect');
    svg.appendChild(square);
    let x: number;
    let y: number;
    if (this.gameUX.onTop === NORTH) {
      x = file * this.squareDim;
      y = (position.ranks - rank - 1) * squareDim;
    } else {
      x = (position.files - file - 1) * squareDim;
      y = rank * this.squareDim;
    }
    svg.setAttribute('x', String(x));
    svg.setAttribute('y', String(y));
    svg.setAttribute('height', String(squareDim));
    svg.setAttribute('width', String(squareDim));
    svg.dataset.file = String(file);
    svg.dataset.rank = String(rank);
    square.setAttribute('x', "0");
    square.setAttribute('y', "0");
    square.setAttribute('height', String(squareDim));
    square.setAttribute('width', String(squareDim));
    const fill = ((file + rank) % 2 == 0) ? EVEN_SQUARE : ODD_SQUARE;
    square.setAttribute('fill', fill);
    const index = fr(position.files, file, rank);
    if (position.squares[index].blocked === true) {
      this.setupBlocked(svg);
    }
    const points = position.squares[index].points;
    if (points[0] || points[1]) {
      this.setupPoints(svg, points);
    }
    return svg;
  }

  setupFileBar = function(this: Board) {
    const position = this.gameUX.game.position;
    const gameUX = this.gameUX;
    const group = document.createElementNS(SVGNS, 'g');
    const files = position.files;
    const ranks = position.ranks;
    for (let i = 0; i < files; i++) {
      const text = document.createElementNS(SVGNS, 'text');
      text.style.fontSize = 'small';
      if (gameUX.onTop === NORTH) {
        text.textContent = String.fromCharCode(97 + i);
      } else {
        text.textContent = String.fromCharCode(97 + files - i - 1);
      }
      text.setAttribute('x', String(i * this.squareDim + this.squareDim / 2.5));
      text.setAttribute('y', String(ranks * this.squareDim + 15));
      group.appendChild(text);
    }
    this.svg.appendChild(group);
  }

  setupRankBar = function(this: Board) {
    const position = this.gameUX.game.position;
    const group = document.createElementNS(SVGNS, 'g');
    const files = position.files;
    const ranks = position.ranks;
    for (let i = 0; i < ranks; i++) {
      const text = document.createElementNS(SVGNS, 'text');
      text.style.fontSize = 'small';
      if (this.gameUX.onTop === NORTH) {
        text.textContent = String(ranks - i);
      } else {
        text.textContent = String(i + 1);
      }
      text.setAttribute('x', String(files * this.squareDim + 10));
      text.setAttribute('y', String(i * this.squareDim + this.squareDim / 2.0));
      group.appendChild(text);
    }
    this.svg.appendChild(group);
  }

  setupBars = function(this: Board) {
    this.setupFileBar();
    this.setupRankBar();
  }

  setupSideIndicator = function(this: Board, side: number, sideGroup: SVGElement, sideElement: SVGElement,
    x: number, y: number) {
    sideElement.setAttribute('x', String(x));
    sideElement.setAttribute('y', String(y));
    sideElement.classList.add('side-indicator');
    if (side === SOUTH) {
      sideElement.classList.add('south');
    } else {
      sideElement.classList.add('north');
    }
    sideGroup.appendChild(sideElement);
  }

  setupSideIndicators = function(this: Board) {
    const group = document.createElementNS(SVGNS, 'g');
    const files = this.gameUX.game.position.files;
    const ranks = this.gameUX.game.position.ranks;
    const squareDim = this.squareDim;
    const southIndicator = document.createElementNS(SVGNS, 'text');
    const northIndicator = document.createElementNS(SVGNS, 'text');
    southIndicator.style.fontSize = 'xx-small';
    northIndicator.style.fontSize = 'xx-small';
    if (this.gameUX.onTop === NORTH) {
      this.setupSideIndicator(SOUTH, group, southIndicator, files * squareDim + 2, ranks * squareDim);
      this.setupSideIndicator(NORTH, group, northIndicator, files * squareDim + 2, 12);
    } else {
      this.setupSideIndicator(NORTH, group, northIndicator, files * squareDim + 2, ranks * squareDim);
      this.setupSideIndicator(SOUTH, group, southIndicator, files * squareDim + 2, 12);
    }
    this.svg.appendChild(group);
  }

  setup = function(this: Board) {
    const svg = this.svg;
    const div = svg.parentElement as HTMLDivElement;
    if (!div) return;

    svg.innerHTML = '';
    const dim = div.offsetWidth;
    svg.setAttribute('width', String(dim));
    svg.setAttribute('height', String(dim));
    const position = this.gameUX.game.position;
    this.squareDim = this.calcSquareDim(dim, dim, position.files, position.ranks);
    this.squares = [];
    for (let rank = 0; rank < position.ranks; rank++) {
      for (let file = 0; file < position.files; file++) {
        const square = this.setupSquare(file, rank);
        this.squares.push(square);
        svg.appendChild(square);
      }
    }
    this.setupBars();
    this.setupSideIndicators();
  }

  updateSideIndicators = function(this: Board) {
    const position = this.gameUX.game.position;
    let indicator: HTMLElement | null;
    indicator = this.gameUX.div.querySelector('.side-indicator.south');
    if (indicator) {
      indicator.textContent = "S" + ((position.side === SOUTH) ? "*" : "");
    }
    indicator = this.gameUX.div.querySelector('.side-indicator.north');
    if (indicator) {
      indicator.textContent = "N" + ((position.side === NORTH) ? "*" : "");
    }
  }

  placePiece = function(this: Board, square: SVGElement, piece: [number, number]) {
    const squareDim = this.squareDim;

    const pieceDim = squareDim * (3.0 / 4.0);
    const x = (squareDim - pieceDim) / 2.0;
    const y = x;
    const pieceElement = document.createElementNS(SVGNS, 'image');
    pieceElement.setAttribute('x', String(x));
    pieceElement.setAttribute('y', String(y));
    pieceElement.setAttribute('width', String(pieceDim));
    pieceElement.setAttribute('height', String(pieceDim));
    pieceElement.setAttribute('class', 'piece dynamic');
    square.appendChild(pieceElement);
    if ((piece[0] | piece[1]) > 0) {
      if (piece[0] === ROOK) {
        pieceElement.setAttribute('href', SOUTH_ROOK_IMAGE);
      } else if (piece[0] === BISHOP) {
        pieceElement.setAttribute('href', SOUTH_BISHOP_IMAGE);
      } else if (piece[1] === ROOK) {
        pieceElement.setAttribute('href', NORTH_ROOK_IMAGE);
      } else {
        pieceElement.setAttribute('href', NORTH_BISHOP_IMAGE);
      }
    }
  }

  setLastMove = function(this: Board, square: SVGElement) {
    const lastMoveElement = document.createElementNS(SVGNS, 'rect');
    lastMoveElement.setAttribute('x', '0');
    lastMoveElement.setAttribute('y', '0');
    lastMoveElement.setAttribute('width', String(this.squareDim));
    lastMoveElement.setAttribute('height', String(this.squareDim));
    lastMoveElement.setAttribute('fill', LAST_MOVE_COLOR);
    lastMoveElement.setAttribute('fill-opacity', '20%');
    lastMoveElement.setAttribute('class', 'last-move dynamic');
    square.appendChild(lastMoveElement);
  }

  setFrozen = function(this: Board, square: SVGElement) {
    const squareDim = this.squareDim;

    const frozen = document.createElementNS(SVGNS, 'image');
    const frozenDim = squareDim * (3.0 / 7.0);
    const x = (squareDim - frozenDim) / 2.0;
    const y = x;
    square.appendChild(frozen);
    frozen.setAttribute('x', String(x));
    frozen.setAttribute('y', String(y));
    frozen.setAttribute('height', String(frozenDim));
    frozen.setAttribute('width', String(frozenDim));
    frozen.setAttribute('href', FROZEN_SQUARE_IMAGE);
    frozen.setAttribute('stroke', "Red");
  }

  update = function(this: Board) {
    const position = this.gameUX.game.position;

    this.updateSideIndicators();
    for (let rank = 0; rank < position.ranks; rank++) {
      for (let file = 0; file < position.files; file++) {
        const index = fr(position.files, file, rank);
        const square = this.squares[index];
        const piece = position.squares[index].piece;
        const dynamicElements = square.querySelectorAll('.dynamic');
        for (const element of dynamicElements) {
          element.remove();
        }
        const lastMove = this.gameUX.game.history.value.move;
        if (lastMove) {
          if ((file === lastMove.fromFile && rank === lastMove.fromRank) ||
            (file === lastMove.toFile && rank === lastMove.toRank)) {
            this.setLastMove(square);
          }
        }
        if ((piece[0] | piece[1]) > 0) {
          this.placePiece(square, piece);
          const points = position.squares[index].points;
          if ((piece[0] && points[0]) || (piece[1] && points[1]) && position.frozen) {
            this.setFrozen(square);
          }
        }
      }
    }
  }

  redraw = function(this: Board) {
    this.setup();
    this.update();
  }

  getSquare = function(this: Board, x: number, y: number) {
    for (const square of this.squares) {
      const rect = square.getBoundingClientRect();
      if (rect.left <= x && rect.top <= y &&
        rect.right >= x && rect.bottom >= y) {
        return square;
      }
    }
    return null;
  }

  setSelectedSquare = function(this: Board, file: number, rank: number) {
    const square = this.squares[fr(this.gameUX.game.position.files, file, rank)];
    if (square) {
      const selectedElement = document.createElementNS(SVGNS, 'rect');
      selectedElement.setAttribute('x', '0');
      selectedElement.setAttribute('y', '0');
      selectedElement.setAttribute('width', String(this.squareDim));
      selectedElement.setAttribute('height', String(this.squareDim));
      selectedElement.setAttribute('fill', SELECTED_SQUARE_COLOR);
      selectedElement.setAttribute('fill-opacity', '20%');
      selectedElement.setAttribute('class', 'selected-square dynamic');
      square.appendChild(selectedElement);
    }
  }

  selectPieceMoves = function(this: Board, file: number, rank: number) {
    const pieceMoves: Move[] = [];
    for (const move of this.gameUX.game.position.moves) {
      if (move.fromFile === file && move.fromRank === rank) {
        pieceMoves.push(move);
      }
    }
    return pieceMoves;
  }

  setTracerOn = function(this: Board, file: number, rank: number) {
    const moves = this.selectPieceMoves(file, rank);
    for (const move of moves) {
      const toFile = move.toFile;
      const toRank = move.toRank;
      const index = fr(this.gameUX.game.position.files, toFile, toRank);
      const toSquare = this.squares[index];
      const tracerElement = document.createElementNS(SVGNS, 'circle');
      const r = this.squareDim / 8;
      const cx = this.squareDim / 2;
      const cy = this.squareDim / 2;
      tracerElement.setAttribute('cx', String(cx));
      tracerElement.setAttribute('cy', String(cy));
      tracerElement.setAttribute('r', String(r));
      tracerElement.setAttribute('fill', TRACER_COLOR);
      tracerElement.setAttribute('fill-opacity', '30%');
      tracerElement.setAttribute('class', 'tracer dynamic');
      toSquare.appendChild(tracerElement);
    }
  }

  selectPiece = function(this: Board, square: SVGElement, file: number, rank: number) {
    square.setAttribute('fill', SELECTED_SQUARE);
    this.selectedPiece = [file, rank];
    this.setSelectedSquare(file, rank);
    this.setTracerOn(file, rank);
  }

  movePiece = function(this: Board, file: number, rank: number): boolean {
    if (this.selectedPiece === null) return false;
    const move: Move = {
      fromFile: this.selectedPiece[0],
      fromRank: this.selectedPiece[1],
      toFile: file,
      toRank: rank,
    };

    try {
      gameMove(this.gameUX.game, move);
    } catch (err) {
      return false;
    }
    return true;
  }

  addEvents(this: Board) {
    const board = this;
    const gameUX = this.gameUX;
    const svg = this.svg;

    window.onresize = () => board.redraw();

    let squareDown: SVGElement | null = null;
    let rovingPiece: SVGElement | null = null;

    svg.addEventListener('mousedown', function(e) {
      e.preventDefault();
      const square = board.getSquare(e.clientX, e.clientY);
      if (square) {
        const file = Number(square.dataset.file);
        const rank = Number(square.dataset.rank);
        board.updateBasedOnState(square, file, rank);
        if (gameUX.gameUXState === GameUXState.WaitingUser &&
          squareDown !== square) {
          board.updateBasedOnState(square, file, rank);
        }
        squareDown = square;
      }
      if (rovingPiece === null && squareDown) {
        const pieceElement = <SVGElement | null>squareDown.querySelector('.piece');
        if (pieceElement) {
          rovingPiece = document.createElementNS(SVGNS, 'image');
          rovingPiece.setAttribute('width', String(pieceElement.getAttribute('width')));
          rovingPiece.setAttribute('height', String(pieceElement.getAttribute('height')));
          rovingPiece.setAttribute('href', String(pieceElement.getAttribute('href')));
          rovingPiece.style.visibility = "hidden";
          rovingPiece.style.opacity = "50%";
          svg.appendChild(rovingPiece);
        }
      }
    });

    svg.addEventListener('mouseup', function(e) {
      e.preventDefault();
      const square = board.getSquare(e.clientX, e.clientY);
      if (square) {
        const file = Number(square.dataset.file);
        const rank = Number(square.dataset.rank);
        if (squareDown !== square) {
          board.updateBasedOnState(square, file, rank);
          squareDown = null;
        }
      }
      rovingPiece?.remove();
      rovingPiece = null;
    });

    svg.addEventListener('mousemove', function(e) {
      e.preventDefault();
      if (rovingPiece) {
        const width = Number(rovingPiece.getAttribute('width'));
        const height = Number(rovingPiece.getAttribute('height'));
        const x = e.offsetX - width / 2.0;
        const y = e.offsetY - height / 2.0;
        rovingPiece.setAttribute('x', String(x));
        rovingPiece.setAttribute('y', String(y));
        rovingPiece.style.visibility = "visible";
      }
    });

  }

  updateBasedOnState = function(this: Board, square: SVGElement | null, file: number, rank: number) {
    const gameUX = this.gameUX;
    switch (gameUX.gameUXState) {
      case GameUXState.SettingUp:
        gameUX.components['positionSetup']?.setSquare(file, rank);
        this.redraw();
        break;
      case GameUXState.WaitingOtherPlayer:
        break;
      case GameUXState.WaitingUser:
        if (square) {
          this.selectPiece(square, file, rank);
          gameUX.gameUXState = GameUXState.PieceSelected;
        }
        break;
      case GameUXState.PieceSelected:
        if (this.movePiece(file, rank) === true && gameUX.inplay === true) {
          gameUX.gameUXState = GameUXState.WaitingOtherPlayer;
        } else {
          gameUX.gameUXState = GameUXState.WaitingUser;
        }
        gameUX.update();
        break;
      case GameUXState.GameOver:
      default:
        break;
    }
  }

}


