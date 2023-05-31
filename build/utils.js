export class CharacterInputStream {
    constructor(string) {
        this.string = string;
        this.index = 0;
    }
    peek() {
        return this.string[this.index];
    }
    back() {
        this.index--;
    }
    next() {
        return this.string[this.index++];
    }
    eof() {
        return this.index >= this.string.length;
    }
}
