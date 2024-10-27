import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
title.innerHTML = APP_NAME;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
canvas.style.cursor = "none";

function blank(ctx:CanvasRenderingContext2D|null){
    if(ctx){
        ctx.clearRect(0, 0, 256, 256);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 256);
    }
}
blank(ctx);

let currentLine: MarkerLine | null = null;
let displayList: Displayable[] = [];
let redoStack: Displayable[] = [];
let thickness = 2;
let cursor = "*";

const event1 = new Event("drawing-changed");
const event2 = new Event("tool-moved");

function redraw(){
    if(ctx){
        blank(ctx)
        ctx.strokeStyle = "black";
        for(const object of displayList){
            object.display(ctx);
        }
    }
}

canvas.addEventListener('drawing-changed', redraw);
canvas.addEventListener('tool-moved', redraw);

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}
class MarkerLine implements Displayable{
    private points: { x: number, y: number }[];
    private width: number;

    constructor(initialX: number, initialY: number, initialWidth: number=2) {
        this.points = [{ x: initialX, y: initialY }];
        this.width = initialWidth;
    }

    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D): void {
        if (this.points.length > 1) {
            context.save;
            context.lineWidth = this.width;
            context.beginPath();
            for (let i = 0; i < this.points.length - 1; i++) {
                context.moveTo(this.points[i].x, this.points[i].y);
                context.lineTo(this.points[i + 1].x, this.points[i + 1].y);
            }
            context.stroke();
            context.restore();
        }
    }
}

function cursorCommand(cursor:string, mouseX:number, mouseY:number){
    if(ctx){
        ctx.font = "32px monospace";
        ctx.fillStyle = "red";
        ctx.fillText(cursor, mouseX - 8, mouseY + 16);
    }
}
function stickerCommand (cursor:string, mouseX:number, mouseY:number){
    const display = (context: CanvasRenderingContext2D): void =>{
        if (context){
            context.font = "32px monospace";
            context.fillStyle = "red";
            context.fillText(cursor, mouseX - 8, mouseY + 16);
        }
    };
    return {display};
}

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    currentLine = new MarkerLine(e.offsetX,e.offsetY,thickness);
    if(cursor != "*"){
        const sticker = stickerCommand(cursor,e.offsetX, e.offsetY)
        displayList.push(sticker);
        console.log("sticker");
    }
    else{
        currentLine = new MarkerLine(e.offsetX,e.offsetY,thickness);
        displayList.push(currentLine);
    }
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        if(currentLine){
            currentLine.drag(e.offsetX,e.offsetY);
            canvas.dispatchEvent(event1);
        }
    }
    canvas.dispatchEvent(event2);
    cursorCommand(cursor,e.offsetX, e.offsetY);
  });
canvas.addEventListener("mouseout", function(){
    canvas.dispatchEvent(event2);
});

globalThis.addEventListener("mouseup", function() {
    if (isDrawing) {
        isDrawing = false;
    }
});

const buttonGrid = document.createElement('div');
buttonGrid.className = 'button-grid';
app.appendChild(buttonGrid);

function newButton(name:string){
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = name;
    buttonGrid.appendChild(button);
    return button;
}

const clearButton = newButton("Clear")
clearButton.addEventListener("click", function () {
    blank(ctx);
    displayList = [];
    redoStack = [];
    cursor = "*";
});

const undoButton = newButton("Undo");
undoButton.addEventListener("click", function () {
    if(displayList.length > 0){
        const redoline = displayList.pop();
        if(redoline){
            redoStack.push(redoline);
        }
        canvas.dispatchEvent(event1);
    }
});

const redoButton = newButton("Redo");
redoButton.addEventListener("click", function () {
    if(redoStack.length > 0){
        const redoline = redoStack.pop();
        if(redoline){
            displayList.push(redoline);
        }
        canvas.dispatchEvent(event1);
    }
});

const thinButton = newButton("Thin");
thinButton.addEventListener("click", function () {
    cursor = "*";
    thickness = 2;
});
const thickButton = newButton("Thick");
thickButton.addEventListener("click", function () {
    cursor = "*";
    thickness = 5;
});

interface Emoji{
    symbol: string;
}
const emojiList: Emoji[] = [
    {symbol: "😍"},
    {symbol: "🌼"},
    {symbol: "🍜"}
];
function newEmoji(name:string){
    const emojiButton = newButton(name);
    emojiButton.addEventListener("click", function () {
        cursor = name;
        canvas.dispatchEvent(event2)
    });
}
const customButton = newButton("Custom");
customButton.addEventListener("click", function () {
    const customEmoji = prompt("Enter a Custom Emoji");
    if(customEmoji){
        emojiList.push({symbol:customEmoji})
        newEmoji(customEmoji);
    }});
for (const items of emojiList){
    newEmoji(items.symbol);
}
