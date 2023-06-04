import { DOMBoard } from "./dom-board.js";
import { GameBoard } from "./game-board.js";
const searchParams = new URL(window.location.href).searchParams;
let gameRules;
if (searchParams.get("shogi") !== null) {
    gameRules = (await import("./shogi-rules.js")).ShogiRules;
}
else {
    gameRules = (await import("./chess-rules.js")).ChessRules;
}
const board = new DOMBoard({
    container: "#board-container",
    width: gameRules.boardWidth,
    height: gameRules.boardHeight
});
const gameBoard = new GameBoard(board, gameRules);
gameBoard.loadStartPosition();
