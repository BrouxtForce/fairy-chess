import { CharacterInputStream } from "./utils.js";
class PieceRules {
    constructor(betza) {
        this.moddedPieceAtoms = PieceRules.parseBetza(betza);
    }
    generateLegalMoves(pieceLocation, boardSize, turn, getPiece) {
        const allLegalMoves = [];
        for (const moddedPieceAtom of this.moddedPieceAtoms) {
            const atomMoves = PieceRules.generateModdedPieceAtomMoves(moddedPieceAtom, pieceLocation, boardSize, turn, getPiece);
            allLegalMoves.push(...atomMoves);
        }
        return allLegalMoves;
    }
    static generateModdedPieceAtomMoves(moddedAtom, pieceLocation, boardSize, turn, getPiece) {
        const step = PieceRules.getPieceAtomMovement(moddedAtom.atom);
        const possibleSteps = [];
        const modifier = moddedAtom.modifier;
        const movesMask = PieceRules.generateMoveMask(modifier, turn);
        for (let count = 0; count < 1 || (count < 2 && Math.abs(step[0]) !== Math.abs(step[1])); count++) {
            for (let i = 1; i >= -1; i -= 2) {
                for (let j = 1; j >= -1; j -= 2) {
                    const move = [step[0] * i, step[1] * j];
                    if (movesMask[move[1] + 3][move[0] + 3]) {
                        possibleSteps.push(move);
                    }
                    if (step[1] === 0)
                        break;
                }
                if (step[0] === 0)
                    break;
            }
            let swap = step[1];
            step[1] = step[0];
            step[0] = swap;
        }
        const possibleMoves = [];
        let count = 1;
        if (modifier.rider) {
            count = Infinity;
        }
        else if (modifier.count !== undefined) {
            count = modifier.count;
        }
        for (const step of possibleSteps) {
            for (let i = 1; i <= count; i++) {
                const move = [pieceLocation[0] + step[0] * i, pieceLocation[1] + step[1] * i];
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
    static getPieceAtomMovement(atom) {
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
    static generateMoveMask(modifier, turn) {
        const mask = Array(7).fill(0).map(() => Array(7).fill(false));
        if (modifier.forward) {
            mask[0].fill(true);
            mask[1].fill(true);
            mask[2].fill(true);
        }
        else if (modifier.bigForward) {
            mask[0].fill(true);
            mask[1].fill(true);
        }
        if (modifier.back) {
            mask[4].fill(true);
            mask[5].fill(true);
            mask[6].fill(true);
        }
        else if (modifier.bigBack) {
            mask[5].fill(true);
            mask[6].fill(true);
        }
        if (modifier.left) {
            mask.forEach(array => array.fill(true, 0, 3));
        }
        else if (modifier.bigLeft) {
            mask.forEach(array => array.fill(true, 0, 2));
        }
        if (modifier.right) {
            mask.forEach(array => array.fill(true, 4));
        }
        else if (modifier.bigRight) {
            mask.forEach(array => array.fill(true, 5));
        }
        if (turn === "b") {
            mask.reverse();
        }
        return mask;
    }
    static parseBetzaModifier(modifiers) {
        const stream = new CharacterInputStream(modifiers);
        const modifier = {};
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
    static parseBetzaAtom(atom) {
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
    static parseBetza(betza) {
        const stream = new CharacterInputStream(betza.replace(/\+/g, ""));
        const moddedPieceAtoms = [];
        let readCharacters = "";
        while (!stream.eof()) {
            let char = stream.next();
            if (char === char.toUpperCase()) {
                const atom = PieceRules.parseBetzaAtom(char);
                const modifier = PieceRules.parseBetzaModifier(readCharacters);
                readCharacters = "";
                if (char === stream.peek()) {
                    stream.next();
                    modifier.rider = true;
                }
                else if (/[0-9]/.test(stream.peek())) {
                    let numString = stream.next();
                    while (/[0-9]/.test(stream.peek())) {
                        numString += stream.next();
                    }
                    modifier.count = Number.parseInt(numString);
                }
                moddedPieceAtoms.push({ atom, modifier });
                continue;
            }
            readCharacters += char;
        }
        return moddedPieceAtoms;
    }
}
export class GameRules {
    constructor(config) {
        this.pieceRulesMap = new Map();
        this.symbolToNameMap = new Map();
        this.pieceImageMap = new Map();
        this.boardWidth = config.boardWidth;
        this.boardHeight = config.boardHeight;
        this.startingPosition = config.startingPosition;
        this.imagePath = config.imagePath ?? "";
    }
    addPiece(symbol, name, betza) {
        let pieceRules;
        if (typeof betza === "string") {
            pieceRules = new PieceRules(betza);
        }
        else {
            pieceRules = betza;
        }
        this.pieceRulesMap.set(symbol, pieceRules);
        this.symbolToNameMap.set(symbol, name);
        if (this.imagePath) {
            this.loadImage(this.imagePath, symbol);
        }
    }
    addPieces(...args) {
        for (const arg of args) {
            this.addPiece(...arg);
        }
    }
    getImage(symbol) {
        const imageNode = this.pieceImageMap.get(symbol);
        if (imageNode === undefined) {
            return null;
        }
        return imageNode.cloneNode();
    }
    loadImage(path, symbol) {
        const wImage = new Image();
        wImage.src = path.replace("*", "w" + symbol);
        this.pieceImageMap.set("w" + symbol, wImage);
        const bImage = new Image();
        bImage.src = path.replace("*", "b" + symbol);
        this.pieceImageMap.set("b" + symbol, bImage);
    }
}
