import "./style.css";

const APP_NAME = "SketchPad";
const title = document.querySelector<HTMLDivElement>("h1")!;
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;
title.innerHTML = APP_NAME;
const canvas = document.createElement("canvas") as HTMLCanvasElement;
canvas.width = 512;
canvas.height = 512;
app.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.style.cursor = "none";
blank(ctx);

const buttonGrid = document.createElement("div");
buttonGrid.className = "button-grid";
app.appendChild(buttonGrid);
const exportUI = document.querySelector<HTMLDivElement>("#export")!;
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportUI.append(exportButton);

const hueSelector = document.getElementById("hue") as HTMLInputElement;
const lightSelector = document.getElementById("light") as HTMLInputElement;
const colorBox = document.querySelector(".color-box") as HTMLElement;
const undoStack: Displayable[] = [];
const redoStack: Displayable[] = [];
const emojiList: Emoji[] = [{ symbol: "❤️" }, { symbol: "😊" }, { symbol: "🧁" }];
let currentColor: string;
let currentLine: MarkerLine | null = null;
let thickness = 2;
let cursor = "🖋️";
let isDrawing = false;
interface Emoji {
  symbol: string;
}
interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

const event1 = new Event("drawing-changed");
const event2 = new Event("tool-moved");
canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

function selectColor() {
  const hueValue = hueSelector.value;
  const lightValue = lightSelector.value;
  const colorValue = `hsl(${hueValue}, 100%, ${lightValue}%)`;
  document.documentElement.style.setProperty("--dynamic-color", colorValue);
  if (colorBox && hueValue && lightValue) {
    colorBox.style.backgroundColor = colorValue;
    hueSelector.style.background = `linear-gradient(to right, 
        hsl(0, 100%, ${lightValue}%),
        hsl(50, 100%, ${lightValue}%),
        hsl(100, 100%, ${lightValue}%),
        hsl(150, 100%, ${lightValue}%),
        hsl(200, 100%, ${lightValue}%),
        hsl(250, 100%, ${lightValue}%), 
        hsl(300, 100%, ${lightValue}%))`;
    lightSelector.style.background = `linear-gradient(to right, 
        hsl(${hueValue}, 100%, 0%), 
        hsl(${hueValue}, 100%, 50%), 
        hsl(${hueValue}, 100%, 100%))`;
    currentColor = colorBox.style.backgroundColor;
  }
}
hueSelector.addEventListener("input", selectColor);
lightSelector.addEventListener("input", selectColor);
selectColor();

function newButton(name: string) {
  const button = document.createElement("button");
  button.textContent = name;
  buttonGrid.appendChild(button);
  return button;
}
const clearButton = newButton("Clear");
clearButton.addEventListener("click", function () {
  while (undoStack.length > 0) undoStack.pop();
  while (redoStack.length > 0) redoStack.pop();
  canvas.dispatchEvent(event1);
});

const undoButton = newButton("Undo");
const redoButton = newButton("Redo");
function buttonEvent(button: HTMLButtonElement, display: Displayable[], display2: Displayable[]) {
  button.addEventListener("click", function () {
    if (display && display2) {
      const newLine = display.pop();
      if (newLine) {
        display2.push(newLine);
      }
      canvas.dispatchEvent(event1);
    }
  });
}
buttonEvent(undoButton, undoStack, redoStack);
buttonEvent(redoButton, redoStack, undoStack);
const thinButton = newButton("🖋️");
thinButton.addEventListener("click", function () {
  cursor = "🖋️";
  thickness = 2;
  selectColor();
});
const thickButton = newButton("🖌️");
thickButton.addEventListener("click", function () {
  cursor = "🖌️";
  thickness = 4;
  selectColor();
});
const eraseButton = newButton("☐");
eraseButton.addEventListener("click", function () {
  cursor = "☐";
  thickness = 8;
  currentColor = `white`; 
});
function newEmoji(name: string) {
  const emojiButton = newButton(name);
  emojiButton.addEventListener("click", function () {
    cursor = name;
    canvas.dispatchEvent(event2);
  });
}
const customButton = newButton("Custom");
customButton.addEventListener("click", function () {
  const customEmoji = prompt("Enter a Custom Emoji");
  if (customEmoji) {
    emojiList.push({ symbol: customEmoji });
    newEmoji(customEmoji);
  }
});
for (const items of emojiList) {
  newEmoji(items.symbol);
}

function blank(ctx: CanvasRenderingContext2D | null) {
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 512, 512);
  }
}
function draw(context: CanvasRenderingContext2D | null): void {
  if (context) {
    for (const object of undoStack) {
      object.display(context);
    }
  }
}
function redraw() {
  if (ctx) {
    blank(ctx);
    draw(ctx);
  }
}
class MarkerLine implements Displayable {
  private points: { x: number; y: number }[];
  private width: number;
  private color: string;
  private cursor: string;

  constructor(initialX: number, initialY: number, initialWidth: number = 2, color: string, cursor: string) {
    this.points = [{ x: initialX, y: initialY }];
    this.width = initialWidth;
    this.color = color;
    this.cursor = cursor;
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(context: CanvasRenderingContext2D): void {
    if (this.points.length > 1) {
      context.save();
      context.strokeStyle = this.color;
      context.lineWidth = this.width;
      context.beginPath();
      context.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length - 1; i++) {
        const midPoint = {
          x: (this.points[i].x + this.points[i + 1].x) / 2,
          y: (this.points[i].y + this.points[i + 1].y) / 2,
        };
        context.quadraticCurveTo(this.points[i].x, this.points[i].y, midPoint.x, midPoint.y);
      }
      const lastPoint = this.points.length - 1;
      context.lineTo(this.points[lastPoint].x, this.points[lastPoint].y);
      context.stroke();
      context.restore();
    }
    else{
      if(this.cursor == `☐`){
        context.save();
        context.fillStyle = "white";
        context.fillRect(this.points[0].x - 10/2, this.points[0].y - 10/2, 10, 10);
        context.restore();
      }
      else{
        context.save();
        context.beginPath();
        context.arc(this.points[0].x, this.points[0].y, this.width/2, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
        context.restore();
      }
    }
  }
}

function cursorCommand(cursor: string, mouseX: number, mouseY: number, color: string) {
  if (cursor == `☐`) {
    if(ctx){
      ctx.fillStyle = "black";
      ctx.fillRect(mouseX - 12/2, mouseY - 12/2, 12, 12);
      ctx.fillStyle = "white";
      ctx.fillRect(mouseX - 10/2, mouseY - 10/2, 10, 10);
    }
  }
  else{
    if(ctx){
      ctx.font = "16px monospace";
      ctx.fillStyle = color;
      ctx.fillText(cursor, mouseX - 4, mouseY);
    }
  }
}
function stickerCommand(cursor: string, mouseX: number, mouseY: number, color: string) {
  const display = (context: CanvasRenderingContext2D): void => {
    if (context) {
      context.font = "16px monospace";
      context.fillStyle = color;
      context.fillText(cursor, mouseX - 4, mouseY);
    }
  };
  return { display };
}

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = new MarkerLine(e.offsetX, e.offsetY, thickness, currentColor, cursor);
  const sticker = stickerCommand(cursor, e.offsetX, e.offsetY, currentColor);
  if (cursor != "🖋️" && cursor != "🖌️" && cursor != "☐") {
    undoStack.push(sticker);
  } else {
    undoStack.push(currentLine);
  }
  canvas.dispatchEvent(event1);
  cursorCommand(cursor, e.offsetX, e.offsetY, currentColor);
  while (redoStack.length > 0) redoStack.pop();
});
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    if (currentLine) {
      currentLine.drag(e.offsetX, e.offsetY);
      canvas.dispatchEvent(event1);
    }
  }
  canvas.dispatchEvent(event2);
  cursorCommand(cursor, e.offsetX, e.offsetY, currentColor);
});
canvas.addEventListener("mouseout", function () {
  canvas.dispatchEvent(event2);
  console.log(undoStack);
});
canvas.addEventListener("mouseup", function () {
  if (isDrawing) {
    isDrawing = false;
  }
});

exportButton.addEventListener("click", function () {
  const newImage = document.createElement("canvas") as HTMLCanvasElement;
  newImage.width = 2048;
  newImage.height = 2048;
  const imageName = prompt("Enter name of export file:");
  const tempCTX = newImage.getContext("2d");
  if (tempCTX) {
    tempCTX.fillStyle = "white";
    tempCTX.fillRect(0, 0, 2048, 2048);
    tempCTX.scale(4, 4);
    draw(tempCTX);
    tempCTX.setTransform(1, 0, 0, 1, 0, 0);
  }
  const anchor = document.createElement("a");
  anchor.href = newImage.toDataURL("image/png");
  if (imageName) anchor.download = imageName;
  anchor.click();
});
