import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
title.innerHTML = APP_NAME;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 256, 256);
}
let isDrawing = false;
let x = 0;
let y = 0;
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
})
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      drawLine(ctx, x, y, e.offsetX, e.offsetY);
      x = e.offsetX;
      y = e.offsetY;
    }
  });
  
globalThis.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      drawLine(ctx, x, y, e.offsetX, e.offsetY);
      x = 0;
      y = 0;
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
    if (ctx){
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 256, 256);
    }
});