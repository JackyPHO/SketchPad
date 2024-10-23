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
let p: Point[] = [];
const event = new Event("drawing-changed");
//Observer function for "drawing-changed"
function draw(){
    const p1 = p[p.length - 1];
    const p2 = p[p.length - 2];
    drawLine(ctx, p1.x, p1.y, p2.x, p2.y);
}
canvas.addEventListener('drawing-changed', draw)

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    p.push({x:e.offsetX, y:e.offsetY});
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      p.push({x:e.offsetX, y:e.offsetY});
      canvas.dispatchEvent(event);
    }
  });

  
globalThis.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      isDrawing = false;
    }
});
  
function drawLine(ctx:CanvasRenderingContext2D|null, x1:number, y1:number, x2:number, y2:number) {
    if (ctx != null){
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
b1.textContent = "Clear";
app.append(b1);
b1.addEventListener("click", function () {
    blank(ctx);
    p = [];
});