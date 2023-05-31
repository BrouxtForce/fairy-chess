import { DOMBoard } from "./dom-board.js";
import { ChessRules } from "./chess-rules.js";
import { GameBoard } from "./game-board.js";
const board = new DOMBoard({
    container: "#board-container",
    width: 8,
    height: 8
});
const gameBoard = new GameBoard(board, ChessRules);
gameBoard.loadStartPosition();
