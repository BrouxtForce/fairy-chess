import { CharacterInputStream } from "./utils.js";
function parseFenlike(fenlike) {
    const rows = fenlike.split("/");
    const outputRows = [];
    let rowLength = -1;
    for (const row of rows) {
        const currentRow = [];
        const stream = new CharacterInputStream(row);
        while (!stream.eof()) {
            const char = stream.next();
            if (/[0-9]/.test(char)) {
                let numString = char;
                while (!stream.eof() && /[0-9]/.test(stream.peek())) {
                    numString += stream.next();
                }
                let num = Number.parseInt(numString);
                currentRow.push(...Array(num).fill(""));
            }
            else if (char === char.toUpperCase()) {
                let symbol = char;
                while (!stream.eof() && stream.peek() !== stream.peek().toUpperCase()) {
                    symbol += stream.next();
                }
                currentRow.push(symbol);
            }
            else {
                throw `Unexpected character: '${char}'`;
            }
        }
        if (rowLength !== -1 && outputRows[0].length !== rowLength) {
            throw `Nonmatching lengths in fenlike string; '${fenlike}'`;
        }
        rowLength = currentRow.length;
        outputRows.push(currentRow);
    }
    return outputRows;
}
export class GameBoard {
    constructor(domBoard, rules) {
        this.turn = "w";
        this.onDragCallback = (from) => {
            const piece = this.get(...from);
            if (piece === "") {
                return false;
            }
            if (piece[0] !== this.turn) {
                return false;
            }
            const legalMoves = this.generateLegalMoves(from);
            if (legalMoves.length === 0) {
                return false;
            }
            this.domBoard.styleLegalSquares(legalMoves);
            return true;
        };
        this.onDropCallback = (from, to) => {
            const coloredPiece = this.get(...from);
            if (coloredPiece[0] !== this.turn) {
                return false;
            }
            const legalMoves = this.generateLegalMoves(from);
            let isLegalMove = false;
            for (const legalMove of legalMoves) {
                if (legalMove[0] === to[0] && legalMove[1] === to[1]) {
                    isLegalMove = true;
                    break;
                }
            }
            if (!isLegalMove) {
                return false;
            }
            this.moveUnsafe(from, to);
            this.nextTurn();
            return true;
        };
        this.domBoard = domBoard;
        this.rules = rules;
        this.width = domBoard.width;
        this.height = domBoard.height;
        this.state = Array(this.height).fill(0).map(() => Array(this.width).fill(0).map(() => { return { symbol: "", initial: false }; }));
        this.domBoard.onDropCallback = this.onDropCallback;
        this.domBoard.onDragCallback = this.onDragCallback;
    }
    set(x, y, symbol, initial) {
        this.state[y][x].symbol = symbol;
        this.state[y][x].initial = initial ?? false;
        if (symbol !== "") {
            const imageNode = this.rules.getImage(symbol);
            if (imageNode !== null) {
                this.domBoard.insertPieceImage(x, y, imageNode);
            }
        }
        else {
            this.domBoard.removeSquareContents(x, y);
        }
    }
    get(x, y) {
        return this.state[y][x].symbol;
    }
    getInitial(x, y) {
        return this.state[y][x].initial;
    }
    loadStartPosition() {
        let startingRows = parseFenlike(this.rules.startingPosition);
        let startIndex = this.height - startingRows.length;
        if (startingRows[0].length !== this.width) {
            throw "Invalid starting position: Width does not match.";
        }
        for (let y = 0; y < startingRows.length; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!startingRows[y][x]) {
                    continue;
                }
                this.set(x, startIndex + y, "w" + startingRows[y][x], true);
                this.set(x, y, "b" + startingRows[startingRows.length - y - 1][x], true);
            }
        }
    }
    generateLegalMoves(pieceLocation) {
        const piece = this.get(...pieceLocation).slice(1);
        const pieceRules = this.rules.pieceRulesMap.get(piece);
        if (pieceRules === undefined) {
            throw `Piece ${piece} does not have defined rules.`;
        }
        const initial = this.getInitial(...pieceLocation);
        return pieceRules.generateLegalMoves(pieceLocation, [this.width, this.height], initial, this.turn, (pos) => this.get(pos[0], pos[1]));
    }
    setState(x, y, symbol, initial) {
        this.state[y][x].symbol = symbol;
        this.state[y][x].initial = initial ?? false;
    }
    moveUnsafe(from, to) {
        const piece = this.get(...from);
        this.setState(...to, piece);
        this.setState(...from, "");
    }
    nextTurn() {
        this.turn = (this.turn === "w") ? "b" : "w";
    }
}
