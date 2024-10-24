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
let p: Point[] = [];
let q: Point[][] = [];
const event = new Event("drawing-changed");

//Observer function for "drawing-changed"
function redraw(){
    blank(ctx)
    if(ctx){
        ctx.strokeStyle = "black";
        for(const line of q){
            if(line.length > 1){
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[0].y);
                for (const point of line) {
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}
canvas.addEventListener('drawing-changed', redraw);

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    p = [];
    p.push({x:e.offsetX, y:e.offsetY});
    q.push(p);
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        p.push({x:e.offsetX, y:e.offsetY});
        canvas.dispatchEvent(event);
    }
  });

globalThis.addEventListener("mouseup", function() {
    if (isDrawing) {
        isDrawing = false;
        console.log(q);
    }
});

//Adding Clear Button, Erases all user input points and lines
const b1 = document.createElement("button");
b1.className = "button";
b1.textContent = "clear";
app.append(b1);
b1.addEventListener("click", function () {
    blank(ctx);
    q = [];
});

const b2 = document.createElement("button");
b2.className = "button";
b2.textContent = "undo";
app.append(b2);

const b3 = document.createElement("button");
b3.className = "button";
b3.textContent = "redo";
app.append(b3);