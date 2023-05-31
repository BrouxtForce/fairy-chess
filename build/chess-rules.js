import { GameRules } from "./rules.js";
export const ChessRules = new GameRules({
    boardWidth: 8,
    boardHeight: 8,
    startingPosition: "PPPPPPPP/RNBQKBNR",
    imagePath: "assets/wikipedia/*.png"
});
ChessRules.addPieces(["K", "King", "WF"], ["Q", "Queen", "WWFF"], ["N", "Knight", "N"], ["R", "Rook", "WW"], ["B", "Bishop", "FF"], ["P", "Pawn", "imfW2+mfW+cfF"]);
