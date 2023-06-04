export class DOMBoard {
    constructor(config) {
        this.onDropCallback = (from, to) => true;
        this.onDragCallback = (from) => true;
        this.dragSource = null;
        this.sourceCoords = [0, 0];
        this.draggedImage = null;
        this.clickedSquare = false;
        this.clickedSource = [0, 0];
        this.styledLegalSquares = [];
        this.width = config.width;
        this.height = config.height;
        document.documentElement.style.setProperty("--dimensions-x", this.width.toString());
        document.documentElement.style.setProperty("--dimensions-y", this.height.toString());
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
        this.squares = DOMBoard.generateSquareNodes(this.width, this.height);
        for (const squareRow of this.squares) {
            for (const square of squareRow) {
                this.container.appendChild(square);
            }
        }
        this.dragContainer = this.initDragContainer();
        this.initPointerEvents();
    }
    initDragContainer() {
        const dragContainer = document.createElement("div");
        dragContainer.style.position = "absolute";
        dragContainer.className = "drag-container";
        this.container.appendChild(dragContainer);
        return dragContainer;
    }
    initPointerEvents() {
        this.dragContainer.addEventListener("pointermove", event => {
            this.setDraggedPosition(event.clientX, event.clientY);
        });
        this.dragContainer.addEventListener("pointerup", event => {
            if (this.dragSource === null || this.draggedImage === null) {
                return;
            }
            this.draggedImage.style.height = "";
            this.draggedImage.style.width = "";
            this.dragContainer.removeChild(this.draggedImage);
            const destCoords = this.getCoords(event.clientX, event.clientY);
            if (this.sourceCoords[0] === destCoords[0] && this.sourceCoords[1] === destCoords[1]) {
                this.clickedSquare = true;
                this.clickedSource[0] = destCoords[0];
                this.clickedSource[1] = destCoords[1];
                this.dragSource.appendChild(this.draggedImage);
                this.squareAddClass(...destCoords, "clicked");
            }
            else if (this.coordsOnBoard(...destCoords) && this.onDropCallback(this.sourceCoords, destCoords)) {
                this.squares[destCoords[1]][destCoords[0]].replaceChildren(this.draggedImage);
            }
            else {
                this.dragSource.appendChild(this.draggedImage);
            }
            if (!this.clickedSquare) {
                this.unstyleLegalSquares();
            }
            this.dragContainer.style.display = "none";
            this.dragSource = null;
            this.draggedImage = null;
            this.dragContainer.releasePointerCapture(event.pointerId);
        });
        this.container.addEventListener("pointerdown", event => {
            if (this.draggedImage === null) {
                this.sourceCoords = this.getCoords(event.clientX, event.clientY);
                const image = this.getSquare(...this.sourceCoords).firstChild;
                if (this.clickedSquare) {
                    this.unstyleLegalSquares();
                    if (this.clickedSource[0] === this.sourceCoords[0] && this.clickedSource[1] === this.sourceCoords[1]) {
                        this.squareRemoveClass(...this.clickedSource, "clicked");
                        this.clickedSquare = false;
                        return;
                    }
                    else if (this.onDropCallback(this.clickedSource, this.sourceCoords)) {
                        const image = this.getSquare(...this.clickedSource).firstChild;
                        if (image === null) {
                            throw "Unexpected error: Image missing from square";
                        }
                        this.removeSquareContents(...this.clickedSource);
                        this.setSquareContents(...this.sourceCoords, image);
                        this.squareRemoveClass(...this.clickedSource, "clicked");
                        this.clickedSquare = false;
                        return;
                    }
                    this.squareRemoveClass(...this.clickedSource, "clicked");
                    this.clickedSquare = false;
                }
                if (!this.onDragCallback(this.sourceCoords)) {
                    return;
                }
                if (image === null) {
                    return;
                }
                image.style.height = image.clientHeight + "px";
                image.style.width = image.clientWidth + "px";
                this.draggedImage = image;
                this.dragSource = image.parentElement;
                this.setDraggedPosition(event.clientX, event.clientY);
                this.dragSource.removeChild(image);
                this.dragContainer.appendChild(image);
                this.dragContainer.style.display = "block";
                this.dragContainer.setPointerCapture(event.pointerId);
            }
        });
    }
    styleLegalSquares(squares) {
        for (const squareCoord of squares) {
            const square = this.getSquare(...squareCoord);
            this.styledLegalSquares.push(square);
            square.classList.add("legal");
            if (square.children.length > 0) {
                square.classList.add("capture");
            }
        }
    }
    unstyleLegalSquares() {
        while (this.styledLegalSquares.length > 0) {
            const square = this.styledLegalSquares.pop();
            square.classList.remove("legal", "capture");
        }
    }
    setDraggedPosition(clientX, clientY) {
        const containerBounds = this.container.getBoundingClientRect();
        let imageWidth = this.draggedImage?.width ?? 0;
        let imageHeight = this.draggedImage?.height ?? 0;
        let targetX = Math.max(Math.min(clientX - imageWidth / 2, window.innerWidth - imageWidth), 0) - containerBounds.x;
        let targetY = Math.max(Math.min(clientY - imageHeight / 2, window.innerHeight - imageHeight), 0) - containerBounds.y;
        this.dragContainer.style.left = targetX + "px";
        this.dragContainer.style.top = targetY + "px";
    }
    getCoords(clientX, clientY) {
        const containerBounds = this.container.getBoundingClientRect();
        return [
            Math.floor((clientX - containerBounds.x) / containerBounds.width * this.width),
            Math.floor((clientY - containerBounds.y) / containerBounds.height * this.height)
        ];
    }
    coordsOnBoard(x, y) {
        return x >= 0 && x < this.width &&
            y >= 0 && y < this.height;
    }
    insertPieceImage(x, y, image) {
        this.squares[y][x].replaceChildren(image);
        image.draggable = false;
    }
    getSquare(x, y) {
        return this.squares[y][x];
    }
    removeSquareContents(x, y) {
        this.squares[y][x].replaceChildren();
    }
    setSquareContents(x, y, image) {
        this.squares[y][x].replaceChildren(image);
    }
    squareAddClass(x, y, className) {
        this.squares[y][x].classList.add(className);
    }
    squareRemoveClass(x, y, className) {
        this.squares[y][x].classList.remove(className);
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
