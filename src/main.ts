import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
title.innerHTML = APP_NAME;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
function blank(ctx:CanvasRenderingContext2D|null){
    if(ctx){
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 256);
    }
}
blank(ctx);

interface Point{
    x: number,
    y: number
}
let p: Point[];
const q: Point[][] = [];
const event = new Event("drawing-changed");
//Observer function for "drawing-changed"
function draw(){
    isDrawing = false;  
    if(p){
        q.push(p);
    }
    console.log(q);
}
canvas.addEventListener('drawing-changed', draw)

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    p = [];
    p.push({x:e.offsetX, y:e.offsetY});
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        const p1 = {x:e.offsetX, y:e.offsetY};
        const p2 = p[p.length - 1];
        drawLine(ctx, p1.x, p1.y, p2.x, p2.y);
        p.push(p1);
    }
  });

  
globalThis.addEventListener("mouseup", function() {
    if (isDrawing) {
        canvas.dispatchEvent(event);
    }
});
  
function drawLine(ctx:CanvasRenderingContext2D|null, x1:number, y1:number, x2:number, y2:number) {
    if (ctx){
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }
}
const b1 = document.createElement("button");
b1.className = "button";
b1.textContent = "clear";
app.append(b1);
b1.addEventListener("click", function () {
    blank(ctx);
    p = [];
});

const b2 = document.createElement("button");
b2.className = "button";
b2.textContent = "undo";
app.append(b2);

const b3 = document.createElement("button");
b3.className = "button";
b3.textContent = "redo";
app.append(b3);