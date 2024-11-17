import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;
const colorSelector = document.getElementById("color") as HTMLInputElement;
const lightSelector = document.getElementById("light") as HTMLInputElement;
const colorBox = document.querySelector('.color-box') as HTMLElement;
let defaultColor : string = 'black';
function selectColor(Selector:HTMLElement){
    if (Selector) {
        Selector.addEventListener('input', function () {
            const hueValue = colorSelector.value;
            const lightValue = lightSelector.value;
            const colorValue = `hsl(${hueValue}, 100%, ${lightValue}%)`
            document.documentElement.style.setProperty('--dynamic-color', colorValue);
            if (colorBox) {
                colorBox.style.backgroundColor = colorValue;
                defaultColor = colorBox.style.backgroundColor;
            }
        });
    }
}
selectColor(colorSelector);
selectColor(lightSelector);

document.title = APP_NAME;
title.innerHTML = APP_NAME;

const canvas = document.createElement('canvas') as HTMLCanvasElement;
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);
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
let cursor = "🖋️";

const event1 = new Event("drawing-changed");
const event2 = new Event("tool-moved");

function draw(context:CanvasRenderingContext2D|null): void{
    if (context){
        for(const object of displayList){
            object.display(context);
        }
    }
}
function redraw(){
    if(ctx){
        blank(ctx);
        draw(ctx);
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
    private color: string;

    constructor(initialX: number, initialY: number, initialWidth: number=2, color:string) {
        this.points = [{ x: initialX, y: initialY }];
        this.width = initialWidth;
        this.color = color;
    }

    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D): void {
        if (this.points.length > 2) {
            context.save();
            context.strokeStyle = this.color;
            context.lineWidth = this.width;
            context.beginPath();
            context.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length - 1; i++) {
                const midPoint = {
                    x: (this.points[i].x + this.points[i + 1].x) / 2,
                    y: (this.points[i].y + this.points[i + 1].y) / 2
                };
                context.quadraticCurveTo(
                    this.points[i].x,
                    this.points[i].y,
                    midPoint.x,
                    midPoint.y
                );
            }
            const lastPoint = this.points.length - 1;
            context.lineTo(this.points[lastPoint].x, this.points[lastPoint].y);
            context.stroke();
            context.restore();
        }
    }
}

function cursorCommand(cursor:string, mouseX:number, mouseY:number, color:string){
    if(ctx){
        ctx.font = "16px monospace";
        ctx.fillStyle = color;
        ctx.fillText(cursor, mouseX, mouseY);
    }
}
function stickerCommand (cursor:string, mouseX:number, mouseY:number, color:string){
    const display = (context: CanvasRenderingContext2D): void =>{
        if (context){
            context.font = "16px monospace";
            context.fillStyle = color;
            context.fillText(cursor, mouseX, mouseY);
        }
    };
    return {display};
}

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    currentLine = new MarkerLine(e.offsetX,e.offsetY,thickness,defaultColor);
    const sticker = stickerCommand(cursor,e.offsetX, e.offsetY,defaultColor);
    if(cursor != "🖋️" && cursor !="🖌️"){
        displayList.push(sticker);
    }
    else{
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
    cursorCommand(cursor,e.offsetX, e.offsetY,defaultColor);
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
    button.textContent = name;
    buttonGrid.appendChild(button);
    return button;
}

const clearButton = newButton("Clear")
clearButton.addEventListener("click", function () {
    blank(ctx);
    displayList = [];
    redoStack = [];
    cursor = "🖋️";
});

const undoButton = newButton("Undo");
const redoButton = newButton("Redo");
function buttonEvent(button: HTMLButtonElement, display: Displayable[], display2: Displayable[]){
    button.addEventListener("click", function () {
        if(display.length > 0){
            const newLine = display.pop();
            if(newLine){
                display2.push(newLine);
            }
            canvas.dispatchEvent(event1);
        } 
    });
}
buttonEvent(undoButton,displayList,redoStack);
buttonEvent(redoButton,redoStack,displayList);
const thinButton = newButton("🖋️");
thinButton.addEventListener("click", function () {
    cursor = "🖋️";
    thickness = 2;
});
const thickButton = newButton("🖌️");
thickButton.addEventListener("click", function () {
    cursor = "🖌️";
    thickness = 4;
});

interface Emoji{
    symbol: string;
}
const emojiList: Emoji[] = [
    {symbol: "❤️"},
    {symbol: "😊"},
    {symbol: "🧁"}
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
    }
});
for (const items of emojiList){
    newEmoji(items.symbol);
}

const exportUI = document.querySelector<HTMLDivElement>("#export")!;
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportUI.append(exportButton);
exportButton.addEventListener("click", function () {
    const newImage = document.createElement('canvas') as HTMLCanvasElement;
    newImage.width = 1024;
    newImage.height = 1024;
    const tempCTX = newImage.getContext('2d');
    if(tempCTX){
        tempCTX.fillStyle = 'white';
        tempCTX.fillRect(0, 0, 1024, 1024);
        tempCTX.scale(4, 4);
        draw(tempCTX);
        tempCTX.setTransform(1, 0, 0, 1, 0, 0);
    }
    const anchor = document.createElement("a");
    anchor.href = newImage.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
});