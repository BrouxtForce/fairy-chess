export class CharacterInputStream {
    private string: string;
    private index: number;

    constructor(string: string) {
        this.string = string;
        this.index = 0;
    }
    peek(): string {
        return this.string[this.index];
    }
    back(): void {
        this.index--;
    }
    next(): string {
        return this.string[this.index++];
    }
    eof(): boolean {
        return this.index >= this.string.length;
    }
}