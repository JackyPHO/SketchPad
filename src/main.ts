import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
title.innerHTML = APP_NAME;

//Start with a blank canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
function blank(ctx:CanvasRenderingContext2D|null){
    if(ctx){
        ctx.clearRect(0, 0, 256, 256);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 256);
    }
}
blank(ctx);

//Taking User's mouse input and drawing
interface Point{
    x: number,
    y: number
}
let p: MarkerLine | null = null;
let q: Displayable[] = [];
let qq: Displayable[] = [];

const event = new Event("drawing-changed");

//Observer function for "drawing-changed"
function redraw(){
    blank(ctx)
    if(ctx){
        ctx.strokeStyle = "black";
        for(const line of q){
            line.display(ctx);
        }
    }
}

canvas.addEventListener('drawing-changed', redraw);

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    p = new MarkerLine(e.offsetX,e.offsetY);
    q.push(p);
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        if(p){
            p.drag(e.offsetX,e.offsetY);
            canvas.dispatchEvent(event);
        }
    }
  });

globalThis.addEventListener("mouseup", function() {
    if (isDrawing) {
        isDrawing = false;
    }
});

//Adding Clear Button, Erases all user input points and lines
const b1 = document.createElement("button");
b1.className = "button";
b1.textContent = "Clear";
app.append(b1);
b1.addEventListener("click", function () {
    blank(ctx);
    q = [];
    qq = [];
});

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}
class MarkerLine implements Displayable{
    private points: { x: number, y: number }[];

    constructor(initialX: number, initialY: number) {
        this.points = [{ x: initialX, y: initialY }];
    }

    // Adds a new point to extend the line
    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    // Implements the display method
    display(context: CanvasRenderingContext2D): void {
        if (this.points.length > 1) {
            context.beginPath();
            for (let i = 0; i < this.points.length - 1; i++) {
                context.moveTo(this.points[i].x, this.points[i].y);
                context.lineTo(this.points[i + 1].x, this.points[i + 1].y);
            }
            context.stroke();
        }
    }
}

const b2 = document.createElement("button");
b2.className = "button";
b2.textContent = "Undo";
app.append(b2);
b2.addEventListener("click", function () {
    if(q.length > 0){
        const redoline = q.pop();
        if(redoline){
            qq.push(redoline);
        }
        canvas.dispatchEvent(event);
    }
});

const b3 = document.createElement("button");
b3.className = "button";
b3.textContent = "Redo";
app.append(b3);
b3.addEventListener("click", function () {
    if(qq.length > 0){
        const redoline = qq.pop();
        if(redoline){
            q.push(redoline);
        }
        canvas.dispatchEvent(event);
    }
});