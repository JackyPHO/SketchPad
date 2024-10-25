import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
title.innerHTML = APP_NAME;

//Start with a blank canvas
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

let p: MarkerLine | null = null;
let q: Displayable[] = [];
let qq: Displayable[] = [];
let z = 2;
let c: cursorCommand | null = null;

const event = new Event("drawing-changed");
const event1 = new Event("tool-moved");

function redraw(){
    blank(ctx)
    if(ctx){
        ctx.strokeStyle = "black";
        for(const line of q){
            line.display(ctx);
        }
    }
    if(cursorCommand){
        if(c)
            c.execute();
    }
}

canvas.addEventListener('drawing-changed', redraw);
canvas.addEventListener('tool-moved', redraw);

class cursorCommand {
    private point: { x: number, y: number }; 
    constructor(x:number, y:number) {
        this.point = {x, y}
      }
    execute() {
        if (ctx){        
            ctx.font = "32px monospace";
            ctx.fillStyle = "black";
            ctx.fillText("*", this.point.x - 8, this.point.y + 16);
        }
    }
}

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    p = new MarkerLine(e.offsetX,e.offsetY,z);
    c = new cursorCommand(e.offsetX, e.offsetY);
    q.push(p);
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        if(p){
            p.drag(e.offsetX,e.offsetY);
            canvas.dispatchEvent(event);
        }
    }
    c = new cursorCommand(e.offsetX, e.offsetY);
    canvas.dispatchEvent(event1);
  });
canvas.addEventListener("mouseout", function(){
    c = null;
    canvas.dispatchEvent(event1);
});

globalThis.addEventListener("mouseup", function() {
    if (isDrawing) {
        isDrawing = false;
    }
});

function newButton(name:string){
    const b = document.createElement("button");
    b.className = "button";
    b.textContent = name;
    app.append(b)
    return b;
}

const clearButton = newButton("Clear")
clearButton.addEventListener("click", function () {
    blank(ctx);
    q = [];
    qq = [];
});

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

const undoButton = newButton("Undo");
undoButton.addEventListener("click", function () {
    if(q.length > 0){
        const redoline = q.pop();
        if(redoline){
            qq.push(redoline);
        }
        canvas.dispatchEvent(event);
    }
});

const redoButton = newButton("Redo");
redoButton.addEventListener("click", function () {
    if(qq.length > 0){
        const redoline = qq.pop();
        if(redoline){
            q.push(redoline);
        }
        canvas.dispatchEvent(event);
    }
});

const thinButton = newButton("Thin");
thinButton.addEventListener("click", function () {
    z = 2;
});
const thickButton = newButton("Thick");
thickButton.addEventListener("click", function () {
    z = 5;
});