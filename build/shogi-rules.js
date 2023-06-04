import { GameRules } from "./rules.js";
export const ShogiRules = new GameRules({
    boardWidth: 9,
    boardHeight: 9,
    startingPosition: "PPPPPPPPP/1B5R1/LNSGKGSNL",
    onePieceSet: true,
    imagePath: "assets/shogi/*.png",
    flipImages: true
});
ShogiRules.addPieces(["K", "King (玉)", "WF"], ["R", "Rook (飛)", "WW"], ["+R", "Dragon (龍)", "WWF"], ["B", "Bishop (角)", "FF"], ["+B", "Horse (馬)", "WFF"], ["G", "Gold General (金)", "WfF"], ["S", "Silver General (銀)", "FfW"], ["+S", "Promoted Silver General (全)", "WfF"], ["N", "Knight (桂)", "ffN"], ["+N", "Promoted Knight (圭)", "WfF"], ["L", "Lance (香)", "fWW"], ["+L", "Promoted Lance (杏)", "WfF"], ["P", "Pawn (歩)", "fW"], ["+P", "Tokin (と)", "WfF"]);
