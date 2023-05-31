export interface BoardConfig {
    container: HTMLElement | string;
    width: number;
    height: number;
}

// TODO: Break up code (for readability (constructor is quite large))
export class DOMBoard {
    public readonly container: HTMLElement;
    public readonly width: number;
    public readonly height: number;
    public readonly squares: HTMLElement[][];

    public onDropCallback = (from: [number, number], to: [number, number]) => true;
    public onDragCallback = (from: [number, number]) => true;

    private dragSource: HTMLElement | null = null;
    private sourceCoords: [number, number] = [0, 0];
    private draggedImage: HTMLImageElement | null = null;
    private dragContainer: HTMLDivElement;
    private clickedSquare: boolean = false;
    private clickedSource: [number, number] = [0, 0];

    private styledLegalSquares: HTMLElement[] = [];

    constructor(config: BoardConfig) {
        this.width = config.width;
        this.height = config.height;

        if (typeof config.container === "string") {
            const node = document.querySelector(config.container);
            if (!node) {
                throw "BoardConfig.container must not be null";
            }
            this.container = node as HTMLElement;
        } else {
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

    private initDragContainer(): HTMLDivElement {
        const dragContainer = document.createElement("div");
        dragContainer.style.position = "absolute";
        this.container.appendChild(dragContainer);

        return dragContainer;
    }

    private initPointerEvents(): void {
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
            
            // The user tapped the square
            if (this.sourceCoords[0] === destCoords[0] && this.sourceCoords[1] === destCoords[1]) {
                this.clickedSquare = true;
                this.clickedSource[0] = destCoords[0];
                this.clickedSource[1] = destCoords[1];
                this.dragSource.appendChild(this.draggedImage);

                this.squareAddClass(...destCoords, "clicked");
            }
            // The drop succeeds
            else if (this.coordsOnBoard(...destCoords) && this.onDropCallback(this.sourceCoords, destCoords)) {
                this.squares[destCoords[1]][destCoords[0]].replaceChildren(this.draggedImage);
            }
            // The drop fails
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

                const image = this.getSquare(...this.sourceCoords).firstChild as HTMLImageElement | null;
                
                if (this.clickedSquare) {
                    this.unstyleLegalSquares();

                    // The user clicked the same square
                    if (this.clickedSource[0] === this.sourceCoords[0] && this.clickedSource[1] === this.sourceCoords[1]) {
                        this.squareRemoveClass(...this.clickedSource, "clicked");
                        this.clickedSquare = false;
                        return;
                    }

                    // The move succeeds
                    else if (this.onDropCallback(this.clickedSource, this.sourceCoords)) {
                        const image = this.getSquare(...this.clickedSource).firstChild as HTMLImageElement | null;
                        if (image === null) {
                            // Should never happen
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
                this.dragSource = image.parentElement as HTMLElement;

                this.setDraggedPosition(event.clientX, event.clientY);
                
                this.dragSource.removeChild(image);
                this.dragContainer.appendChild(image);

                this.dragContainer.style.display = "block";

                this.dragContainer.setPointerCapture(event.pointerId);
            }
        });
    }

    styleLegalSquares(squares: [number, number][]): void {
        for (const squareCoord of squares) {
            const square = this.getSquare(...squareCoord);
            this.styledLegalSquares.push(square);

            square.classList.add("legal");
        }
    }
    unstyleLegalSquares(): void {
        while (this.styledLegalSquares.length > 0) {
            const square = this.styledLegalSquares.pop() as HTMLElement;
            square.classList.remove("legal");
        }
    }

    setDraggedPosition(clientX: number, clientY: number): void {
        const containerBounds = this.container.getBoundingClientRect();

        let imageWidth = this.draggedImage?.width ?? 0;
        let imageHeight = this.draggedImage?.height ?? 0;

        let targetX = Math.max(Math.min(clientX - imageWidth / 2, window.innerWidth - imageWidth), 0) - containerBounds.x;
        let targetY = Math.max(Math.min(clientY - imageHeight / 2, window.innerHeight - imageHeight), 0) - containerBounds.y;

        this.dragContainer.style.left = targetX + "px";
        this.dragContainer.style.top = targetY + "px";
    }

    getCoords(clientX: number, clientY: number): [number, number] {
        const containerBounds = this.container.getBoundingClientRect();

        return [
            Math.floor((clientX - containerBounds.x) / containerBounds.width * this.width),
            Math.floor((clientY - containerBounds.y) / containerBounds.height * this.height)
        ];
    }

    coordsOnBoard(x: number, y: number): boolean {
        return x >= 0 && x < this.width &&
               y >= 0 && y < this.height;
    }

    insertPieceImage(x: number, y: number, image: HTMLImageElement) {
        this.squares[y][x].replaceChildren(image);
        image.draggable = false;
    }

    getSquare(x: number, y: number): HTMLElement {
        return this.squares[y][x];
    }
    removeSquareContents(x: number, y: number): void {
        this.squares[y][x].replaceChildren();
    }
    setSquareContents(x: number, y: number, image: HTMLImageElement): void {
        this.squares[y][x].replaceChildren(image);
    }

    squareAddClass(x: number, y: number, className: string): void {
        this.squares[y][x].classList.add(className);
    }
    squareRemoveClass(x: number, y: number, className: string): void {
        this.squares[y][x].classList.remove(className);
    }

    private static generateSquareNodes(width: number, height: number): HTMLElement[][] {
        const elementArrays = Array<HTMLElement[]>(height);

        for (let i = 0; i < height; i++) {
            elementArrays[i] = Array<HTMLElement>(width);
            for (let j = 0; j < width; j++) {
                const square = document.createElement("div");
                square.classList.add("square");

                if ((i + j) % 2 === 0) {
                    square.classList.add("light");
                } else {
                    square.classList.add("dark");
                }

                elementArrays[i][j] = square;
            }
        }

        return elementArrays;
    }
}