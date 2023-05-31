export class Board {
    constructor(config) {
        this.width = config.width;
        this.height = config.height;
        if (typeof config.container === "string") {
            const node = document.querySelector(config.container);
            if (!node) {
                throw "BoardConfig.container must not be null";
            }
            this.container = node;
        }
        else {
            this.container = config.container;
        }
        this.container.classList.add("board-container");
        this.squares = Board.generateSquareNodes(this.width, this.height);
        for (const squareRow of this.squares) {
            for (const square of squareRow) {
                this.container.appendChild(square);
            }
        }
    }
    static generateSquareNodes(width, height) {
        const elementArrays = Array(height);
        for (let i = 0; i < height; i++) {
            elementArrays[i] = Array(width);
            for (let j = 0; j < width; j++) {
                const square = document.createElement("div");
                square.classList.add("square");
                if ((i + j) % 2 === 0) {
                    square.classList.add("light");
                }
                else {
                    square.classList.add("dark");
                }
                elementArrays[i][j] = square;
            }
        }
        return elementArrays;
    }
}
