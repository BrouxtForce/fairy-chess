// Betza notation: https://en.wikipedia.org/wiki/Betza%27s_funny_notation
import { CharacterInputStream } from "./utils.js";

/*
PieceAtom types:
    W: Wazir
    F: Ferz
    D: Dabbaba
    N: Knight
    A: Alfil
    H: Threeleaper
    C: Camel
    Z: Zebra
    G: Tripper

PieceAtom movement:
    G   Z   C   H   C   Z   G
    Z   A   N   D   N   A   Z
    C   N   F   W   F   N   C
    H   D   W   0   W   D   H
    C   N   F   W   F   N   C
    Z   A   N   D   N   A   Z
    G   Z   C   H   C   Z   G
*/
type PieceAtom = "W" | "F" | "D" | "N" | "A" | "H" | "C" | "Z" | "G";

interface PieceAtomModifier {
    forward?: boolean;
    back?: boolean;
    left?: boolean;
    right?: boolean;

    bigForward?: boolean;
    bigBack?: boolean;
    bigLeft?: boolean;
    bigRight?: boolean;

    rider?: boolean;

    nonCapturing?: boolean;
    mustCapture?: boolean;

    initial?: boolean;

    count?: number;
}

type ModdedPieceAtom = { atom: PieceAtom, modifier: PieceAtomModifier };

class PieceRules {
    public readonly moddedPieceAtoms: ModdedPieceAtom[];

    constructor(betza: string) {
        this.moddedPieceAtoms = PieceRules.parseBetza(betza);
    }

    
    generateLegalMoves(pieceLocation: [number, number], boardSize: [number, number], turn: "w" | "b", getPiece: (pos: [number, number]) => string): [number, number][] {
        const allLegalMoves: [number, number][] = [];

        for (const moddedPieceAtom of this.moddedPieceAtoms) {
            const atomMoves = PieceRules.generateModdedPieceAtomMoves(moddedPieceAtom, pieceLocation, boardSize, turn, getPiece);

            allLegalMoves.push(...atomMoves);
        }
        
        return allLegalMoves;
    }

    private static generateModdedPieceAtomMoves(moddedAtom: ModdedPieceAtom, pieceLocation: [number, number], boardSize: [number, number], turn: "w" | "b", getPiece: (pos: [number, number]) => string): [number, number][] {
        const step = PieceRules.getPieceAtomMovement(moddedAtom.atom);
        const possibleSteps: [number, number][] = [];

        const modifier = moddedAtom.modifier;
        const movesMask = PieceRules.generateMoveMask(modifier, turn);

        for (let count = 0; count < 1 || (count < 2 && Math.abs(step[0]) !== Math.abs(step[1])); count++) {
            for (let i = 1; i >= -1; i -= 2) {
                for (let j = 1; j >= -1; j -= 2) {
                    const move: [number, number] = [step[0] * i, step[1] * j];

                    if (movesMask[move[1] + 3][move[0] + 3]) {
                        possibleSteps.push(move);
                    }

                    // Avoid duplicates (0 and -0)
                    if (step[1] === 0) break;
                }
                // Avoid duplicates (0 and -0)
                if (step[0] === 0) break;
            }
            let swap = step[1];
            step[1] = step[0];
            step[0] = swap;
        }

        const possibleMoves: [number, number][] = [];

        let count = 1;
        if (modifier.rider) {
            count = Infinity;
        } else if (modifier.count !== undefined) {
            count = modifier.count;
        }

        for (const step of possibleSteps) {
            for (let i = 1; i <= count; i++) {
                const move: [number, number] = [pieceLocation[0] + step[0] * i, pieceLocation[1] + step[1] * i];

                // Break if off board
                if (move[0] < 0 || move[0] >= boardSize[0] || move[1] < 0 || move[1] >= boardSize[1]) {
                    break;
                }
                
                let capturedPiece = getPiece(move);
                if (capturedPiece !== "") {
                    if (capturedPiece[0] === turn) {
                        break;
                    }
                    if (!modifier.nonCapturing) {
                        possibleMoves.push(move);
                    }
                    break;
                }

                if (!modifier.mustCapture) {
                    possibleMoves.push(move);
                }
            }
        }

        return possibleMoves;
    }

    // Returns BR movement
    private static getPieceAtomMovement(atom: PieceAtom): [number, number] {
        switch (atom) {
            case "W": return [1, 0];
            case "F": return [1, 1];
            case "D": return [2, 0];
            case "N": return [2, 1];
            case "A": return [2, 2];
            case "H": return [3, 0];
            case "C": return [3, 1];
            case "Z": return [3, 2];
            case "G": return [3, 3];
            default: throw `Invalid piece atom '${atom}'`;
        }
    }

    private static generateMoveMask(modifier: PieceAtomModifier, turn: "w" | "b"): boolean[][] {
        const mask: boolean[][] = Array(7).fill(0).map(() => Array(7).fill(false));

        // Forwards
        if (modifier.forward) {
            mask[0].fill(true);
            mask[1].fill(true);
            mask[2].fill(true);
        } else if (modifier.bigForward) {
            mask[0].fill(true);
            mask[1].fill(true);
        }

        // Backwards
        if (modifier.back) {
            mask[4].fill(true);
            mask[5].fill(true);
            mask[6].fill(true);
        } else if (modifier.bigBack) {
            mask[5].fill(true);
            mask[6].fill(true);
        }

        // Left
        if (modifier.left) {
            mask.forEach(array => array.fill(true, 0, 3));
        } else if (modifier.bigLeft) {
            mask.forEach(array => array.fill(true, 0, 2));
        }

        // Right
        if (modifier.right) {
            mask.forEach(array => array.fill(true, 4))
        } else if (modifier.bigRight) {
            mask.forEach(array => array.fill(true, 5))
        }

        if (turn === "b") {
            mask.reverse();
        }

        return mask;
    }

    private static parseBetzaModifier(modifiers: string): PieceAtomModifier {
        const stream = new CharacterInputStream(modifiers);
        const modifier: PieceAtomModifier = {};

        while (!stream.eof()) {
            switch (stream.next()) {
                case "f":
                    if (modifier.forward) {
                        modifier.bigForward = true;
                    }
                    modifier.forward = true;
                    break;
                case "b":
                    if (modifier.back) {
                        modifier.bigBack = true;
                    }
                    modifier.back = true;
                    break;
                case "l":
                    if (modifier.left) {
                        modifier.bigLeft = true;
                    }
                    modifier.left = true;
                    break;
                case "r":
                    if (modifier.right) {
                        modifier.bigRight = true;
                    }
                    modifier.right = true;
                    break;
                case "s":
                    modifier.left = true;
                    modifier.right = true;
                    break;
                case "v":
                    modifier.forward = true;
                    modifier.back = true;
                    break;
                case "c":
                    modifier.mustCapture = true;
                    break;
                case "m":
                    modifier.nonCapturing = true;
                    break;
                case "i":
                    modifier.initial = true;
                    break;
            }
        }
        
        if (!modifier.forward && !modifier.back && !modifier.left && !modifier.right &&
        !modifier.bigForward && !modifier.bigBack && !modifier.bigLeft && !modifier.bigRight) {
            modifier.forward = true;
            modifier.back = true;
            modifier.left = true;
            modifier.right = true;
        }

        return modifier;
    }
    private static parseBetzaAtom(atom: string): PieceAtom {
        switch (atom) {
            case "W":
            case "F":
            case "D":
            case "N":
            case "A":
            case "H":
            case "C":
            case "Z":
            case "G":
                return atom;
            default: throw `Invalid piece atom: '${atom}'`;
        }
    }
    // TODO: Implement *, take care of brackets
    private static parseBetza(betza: string): ModdedPieceAtom[] {
        const stream = new CharacterInputStream(betza.replace(/\+/g, ""));
        const moddedPieceAtoms: ModdedPieceAtom[] = [];

        let readCharacters = "";
        while (!stream.eof()) {
            let char = stream.next();

            // Capital letter == Atomic piece move
            if (char === char.toUpperCase()) {
                const atom = PieceRules.parseBetzaAtom(char);
                const modifier = PieceRules.parseBetzaModifier(readCharacters);
                readCharacters = "";

                // Doubled capital letter == rider move
                if (char === stream.peek()) {
                    stream.next();
                    modifier.rider = true;
                }
                // Number == move N spaces
                else if (/[0-9]/.test(stream.peek())) {
                    // Read the whole number (can be any number of digits)
                    let numString = stream.next();
                    while (/[0-9]/.test(stream.peek())) {
                        numString += stream.next();
                    }

                    modifier.count = Number.parseInt(numString);
                }

                // Record the PieceRule
                moddedPieceAtoms.push({ atom, modifier });
                continue;
            }

            readCharacters += char;
        }

        return moddedPieceAtoms;
    }
}

export interface GameRulesConfig {
    boardWidth: number;
    boardHeight: number;

    // Fen-like string of the starting position of one player. Case sensitive.
    // Ex: "PPPPPPPP/RNBQKBNR" for starting chess position
    startingPosition: string;

    // Path to the images to the pieces
    imagePath?: string;
}
export class GameRules {
    public readonly pieceRulesMap: Map<string, PieceRules>;
    public readonly symbolToNameMap: Map<string, string>;
    public readonly pieceImageMap: Map<string, HTMLImageElement>;
    public readonly boardWidth: number;
    public readonly boardHeight: number;
    public readonly startingPosition: string;

    private readonly imagePath: string;

    constructor(config: GameRulesConfig) {
        this.pieceRulesMap = new Map();
        this.symbolToNameMap = new Map();
        this.pieceImageMap = new Map();
        
        this.boardWidth = config.boardWidth;
        this.boardHeight = config.boardHeight;
        this.startingPosition = config.startingPosition;

        this.imagePath = config.imagePath ?? "";
    }

    /** `symbol` must start with a capital and be proceded by (0 or more) lowercase letters. */
    addPiece(symbol: string, name: string, betza: string | PieceRules): void {
        let pieceRules: PieceRules;
        if (typeof betza === "string") {
            pieceRules = new PieceRules(betza);
        } else {
            pieceRules = betza;
        }

        this.pieceRulesMap.set(symbol, pieceRules);
        this.symbolToNameMap.set(symbol, name);

        if (this.imagePath) {
            this.loadImage(this.imagePath, symbol);
        }
    }
    addPieces(...args: [string, string, string | PieceRules][]): void {
        for (const arg of args) {
            this.addPiece(...arg);
        }
    }

    getImage(symbol: string): HTMLImageElement | null {
        const imageNode = this.pieceImageMap.get(symbol);

        if (imageNode === undefined) {
            return null;
        }

        return imageNode.cloneNode() as HTMLImageElement;
    }

    private loadImage(path: string, symbol: string): void {
        const wImage = new Image();
        wImage.src = path.replace("*", "w" + symbol);
        this.pieceImageMap.set("w" + symbol, wImage);

        const bImage = new Image();
        bImage.src = path.replace("*", "b" + symbol);
        this.pieceImageMap.set("b" + symbol, bImage);
    }
}