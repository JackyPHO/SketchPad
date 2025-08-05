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
const emojiGrid = document.createElement("div");
emojiGrid.className = "emoji-grid";
app.appendChild(buttonGrid);
app.appendChild(emojiGrid);
const exportUI = document.querySelector<HTMLDivElement>("#export")!;
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportUI.append(exportButton);

const hueSelector = document.getElementById("hue") as HTMLInputElement;
const lightSelector = document.getElementById("light") as HTMLInputElement;
const thickSelector = document.getElementById("thickness") as HTMLInputElement;
const colorBox = document.querySelector(".color-box") as HTMLElement;
const tools: string[] = ["🖌️", "☐"];
const undoStack: Displayable[] = [];
const redoStack: Displayable[] = [];
const emojiList: Emoji[] = [
  { symbol: "❤️" },
  { symbol: "😊" },
  { symbol: "🧁" },
  { symbol: "❤️" },
  { symbol: "😊" },
  { symbol: "🧁" },
];
const clearButton = newButton("Clear");
const undoButton = newButton("Undo");
const redoButton = newButton("Redo");
const paintButton = newButton("🖌️");
const eraseButton = newButton("☐");
const customButton = newButton("Custom");
let currentColor: string;
let currentLine: MarkerLine | null = null;
let thickness: number;
let cursor = "🖌️";
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
  if (cursor != "☐") {
    const hueValue = hueSelector.value;
    const lightValue = lightSelector.value;
    const thickValue = thickSelector.value;
    const colorValue = `hsl(${hueValue}, 100%, ${lightValue}%)`;
    document.documentElement.style.setProperty("--dynamic-color", colorValue);
    if (colorBox && hueValue && lightValue) {
      colorBox.style.backgroundColor = colorValue;
      hueSelector.style.background = `linear-gradient(to right, 
          hsl(0, 100%, ${lightValue}%),
          hsl(50, 100%, ${lightValue}%),
          hsl(100, 100%, ${lightValue}%),
          hsl(150, 100%, ${lightValue}%),
          hsl(250, 100%, ${lightValue}%), 
          hsl(300, 100%, ${lightValue}%))`;
      lightSelector.style.background = `linear-gradient(to right, 
          hsl(${hueValue}, 100%, 0%), 
          hsl(${hueValue}, 100%, 50%), 
          hsl(${hueValue}, 100%, 100%))`;
      currentColor = colorBox.style.backgroundColor;
      thickness = Number(thickValue);
      const hexacode = rgbToHex(currentColor);
      colorBox.innerText = hexacode;
    }
  }
}
function rgbToHex(rgb: string): string {
  let hex: string = "#";
  const value = rgb
    .substring(4, currentColor.length - 1)
    .replace(/ /g, "")
    .split(",");
  for (const item of value) {
    const conv = Number(item).toString(16);
    const hx = conv.length === 1 ? "0" + conv : conv;
    hex = hex + hx;
  }
  return hex;
}
hueSelector.addEventListener("input", selectColor);
lightSelector.addEventListener("input", selectColor);
thickSelector.addEventListener("input", selectColor);
selectColor();

function newButton(name: string) {
  const button = document.createElement("button");
  button.textContent = name;
  buttonGrid.appendChild(button);
  return button;
}
function buttonEvent(button: HTMLButtonElement, stack1: Displayable[], stack2: Displayable[]) {
  button.addEventListener("click", function () {
    if (button.textContent == "Clear") {
      while (stack1.length > 0) stack1.pop();
      while (stack2.length > 0) stack2.pop();
    } else {
      const newDisplay = stack1.pop();
      if (newDisplay) {
        stack2.push(newDisplay);
      }
    }
    canvas.dispatchEvent(event1);
  });
}
buttonEvent(clearButton, undoStack, redoStack);
buttonEvent(undoButton, undoStack, redoStack);
buttonEvent(redoButton, redoStack, undoStack);
paintButton.addEventListener("click", function () {
  cursor = "🖌️";
  selectColor();
});
eraseButton.addEventListener("click", function () {
  cursor = "☐";
  thickness = 10;
  currentColor = `white`;
});
function newEmoji(name: string) {
  const emojiButton = document.createElement("button");
  emojiButton.textContent = name;
  emojiGrid.appendChild(emojiButton);
  emojiButton.addEventListener("click", function () {
    cursor = name;
    canvas.dispatchEvent(event2);
  });
}
customButton.addEventListener("click", function () {
  const customEmoji = prompt("Enter a Custom Emoji");
  if (customEmoji && customEmoji.length == 1) {
    emojiList.push({ symbol: customEmoji });
    newEmoji(customEmoji);
  }
});
for (const items of emojiList) newEmoji(items.symbol);

function blank(ctx: CanvasRenderingContext2D | null) {
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 512, 512);
  }
}
function draw(context: CanvasRenderingContext2D | null): void {
  if (context) {
    for (const object of undoStack) object.display(context);
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
    if (this.points.length > 0) {
      context.strokeStyle = this.color;
      context.fillStyle = this.color;
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
      if (this.cursor == `☐`) {
        context.fillRect(this.points[0].x - 10 / 2, this.points[0].y - 10 / 2, 10, 10);
        context.fillRect(this.points[lastPoint].x - 10 / 2, this.points[lastPoint].y - 10 / 2, 10, 10);
      } else {
        context.beginPath();
        context.arc(this.points[0].x, this.points[0].y, this.width / 2, 0, 2 * Math.PI);
        context.fill();
        context.beginPath();
        context.arc(this.points[lastPoint].x, this.points[lastPoint].y, this.width / 2, 0, 2 * Math.PI);
        context.fill();
      }
      context.restore();
    }
  }
}

function cursorCommand(cursor: string, mouseX: number, mouseY: number, color: string) {
  if (ctx) {
    if (tools.includes(cursor)) {
      if (cursor == `☐`) {
        ctx.fillStyle = "black";
        ctx.fillRect(mouseX - 12 / 2, mouseY - 12 / 2, 12, 12);
        ctx.fillStyle = "white";
        ctx.fillRect(mouseX - 10 / 2, mouseY - 10 / 2, 10, 10);
      } else {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, thickness / 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
      }
    }
    if (cursor != `☐`) {
      ctx.font = "16px monospace";
      ctx.fillStyle = color;
      ctx.fillText(cursor, mouseX, mouseY);
    }
  }
}
function stickerCommand(cursor: string, mouseX: number, mouseY: number, color: string) {
  const display = (context: CanvasRenderingContext2D): void => {
    if (context) {
      context.font = "16px monospace";
      context.fillStyle = color;
      context.fillText(cursor, mouseX, mouseY);
    }
  };
  return { display };
}

canvas.addEventListener("mousedown", (e) => {
  if (tools.includes(cursor)) {
    isDrawing = true;
    currentLine = new MarkerLine(e.offsetX, e.offsetY, thickness, currentColor, cursor);
    undoStack.push(currentLine);
  } else {
    const sticker = stickerCommand(cursor, e.offsetX, e.offsetY, currentColor);
    undoStack.push(sticker);
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
  canvas.dispatchEvent(event2);
  if (isDrawing) isDrawing = false;
});

exportButton.addEventListener("click", function () {
  const newImage = document.createElement("canvas") as HTMLCanvasElement;
  newImage.width = 2048;
  newImage.height = 2048;
  const imageName = prompt("Enter name of png file:");
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
