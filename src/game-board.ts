import { DOMBoard } from "./dom-board.js";
import { GameRules } from "./rules.js";
import { CharacterInputStream } from "./utils.js";

function parseFenlike(fenlike: string): string[][] {
    const rows = fenlike.split("/");
    const outputRows: string[][] = [];

    let rowLength = -1;

    for (const row of rows) {
        const currentRow: string[] = [];

        const stream = new CharacterInputStream(row);
        while (!stream.eof()) {
            const char = stream.next();

            // If it is a number, skip those squares
            if (/[0-9]/.test(char)) {
                let numString = char;

                // Read while number
                while (!stream.eof() && /[0-9]/.test(stream.peek())) {
                    numString += stream.next();
                }

                let num = Number.parseInt(numString);
                currentRow.push(...Array(num).fill(""));
            }

            // If uppercase, read the symbol
            else if (char === char.toUpperCase()) {
                let symbol = char;

                // Read while lowercase
                while (!stream.eof() && stream.peek() !== stream.peek().toUpperCase()) {
                    symbol += stream.next();
                }

                currentRow.push(symbol);
            }

            // Throw an error
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

interface GamePiece {
    symbol: string;
    initial: boolean;
}

export class GameBoard {
    public readonly domBoard: DOMBoard;
    public readonly rules: GameRules;

    public readonly state: GamePiece[][];
    public readonly width: number;
    public readonly height: number;

    private turn: "w" | "b" = "w";

    constructor(domBoard: DOMBoard, rules: GameRules) {
        this.domBoard = domBoard;
        this.rules = rules;

        this.width = domBoard.width;
        this.height = domBoard.height;

        this.state = Array(this.height).fill(0).map(() => Array(this.width).fill(0).map(() => { return { symbol: "", initial: false } }));

        this.domBoard.onDropCallback = this.onDropCallback;
        this.domBoard.onDragCallback = this.onDragCallback;
    }

    set(x: number, y: number, symbol: string, initial?: boolean) {
        this.state[y][x].symbol = symbol;
        this.state[y][x].initial = initial ?? false;
        if (symbol !== "") {
            const imageNode = this.rules.getImage(symbol);
            if (imageNode !== null) {
                this.domBoard.insertPieceImage(x, y, imageNode);
            }
        } else {
            this.domBoard.removeSquareContents(x, y);
        }
    }
    get(x: number, y: number): string {
        return this.state[y][x].symbol;
    }
    getInitial(x: number, y: number): boolean {
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

                // White pieces
                this.set(x, startIndex + y, "w" + startingRows[y][x], true);
                
                // Black pieces
                this.set(x, y, "b" + startingRows[startingRows.length - y - 1][x], true);
            }
        }
    }

    generateLegalMoves(pieceLocation: [number, number]): [number, number][] {
        // Gets piece and removes color information
        const piece = this.get(...pieceLocation).slice(1);

        const pieceRules = this.rules.pieceRulesMap.get(piece);
        if (pieceRules === undefined) {
            throw `Piece ${piece} does not have defined rules.`;
        }

        const initial = this.getInitial(...pieceLocation);

        return pieceRules.generateLegalMoves(pieceLocation, [this.width, this.height], initial, this.turn, (pos) => this.get(pos[0], pos[1]));
    }

    private onDragCallback = (from: [number, number]): boolean => {
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
    }

    // Arrow function to preserve the 'this' value
    private onDropCallback = (from: [number, number], to: [number, number]): boolean => {
        const coloredPiece = this.get(...from);

        // Not your turn!
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
    }

    private setState(x: number, y: number, symbol: string, initial?: boolean): void {
        this.state[y][x].symbol = symbol;
        this.state[y][x].initial = initial ?? false;
    }
    // Does not check legality
    private moveUnsafe(from: [number, number], to: [number, number]): void {
        const piece = this.get(...from);
        this.setState(...to, piece);
        this.setState(...from, "");
    }

    private nextTurn(): void {
        this.turn = (this.turn === "w") ? "b" : "w";
    }
}