const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let tool = "brush";
let history = [];
let blubs = JSON.parse(localStorage.getItem("blubs")) || [];
let deleteMode = false;

// COLORS
const brushColor = document.getElementById("brushColor");
const fillColor = document.getElementById("fillColor");

// DRAWING
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  if (tool === "brush") {
    ctx.strokeStyle = brushColor.value;
    ctx.lineWidth = 3;
  } else if (tool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
  }

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

// FILL TOOL
document.getElementById("fill").onclick = () => {
  tool = "fill";
};

canvas.addEventListener("mousedown", (e) => {
  if (tool === "fill") {
    floodFill(e.offsetX, e.offsetY);
    return;
  }

  drawing = true;
});

function floodFill(x, y) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const targetColor = getPixelColor(data, x, y);
  const fillCol = hexToRgb(fillColor.value);

  if (colorsMatch(targetColor, fillCol)) return;

  const stack = [[x, y]];

  while (stack.length) {
    const [cx, cy] = stack.pop();
    const index = (cy * canvas.width + cx) * 4;

    const currentColor = [
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3]
    ];

    if (!colorsMatch(currentColor, targetColor)) continue;

    // fill pixel
    data[index] = fillCol.r;
    data[index + 1] = fillCol.g;
    data[index + 2] = fillCol.b;
    data[index + 3] = 255;

    // check neighbors
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

// TOOL SWITCH
document.getElementById("brush").onclick = () => tool = "brush";
document.getElementById("eraser").onclick = () => tool = "eraser";

// UNDO
document.getElementById("undo").onclick = () => {
  if (history.length > 0) {
    let img = new Image();
    img.src = history.pop();
    img.onload = () => ctx.drawImage(img, 0, 0);
  }
};

// SAVE STATE
canvas.addEventListener("mouseup", () => {
  history.push(canvas.toDataURL());
});

// DRAG PANEL
const panel = document.getElementById("panel");        
const header = document.getElementById("panel-header"); 

let isDragging = false, offsetX, offsetY;

header.addEventListener("mousedown", (e) => {
  isDragging = true;

  const rect = panel.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  panel.style.left = e.clientX - offsetX + "px";
  panel.style.top = e.clientY - offsetY + "px";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});


// CREATE BLUB
function createBlub(data, type, name) {
  const img = document.createElement("img");
  img.src = data;
  img.className = "blub";

  let x = Math.random() * window.innerWidth;
  let y = Math.random() * window.innerHeight;

  img.style.left = x + "px";
  img.style.top = y + "px";

  animateBlub(img, type);

  img.onmouseenter = (e) => showTooltip(name, e);
  img.onmouseleave = hideTooltip;

  img.onclick = () => {
    if (deleteMode) {
      img.remove();
    }
  };

  document.getElementById("ocean").appendChild(img);
}

// FLOAT ANIMATION
function animateBlub(el, type) {
  let t = 0;
  function move() {
    t += 0.01;
    let x = Math.sin(t) * 50;
    let y = Math.cos(t * 0.5) * 20;

    if (type === "coral") {
      el.style.transform = `translateY(${Math.sin(t)*5}px)`;
    } else {
      el.style.transform = `translate(${x}px, ${y}px)`;
    }

    requestAnimationFrame(move);
  }
  move();
}

// TOOLTIP
let tooltip;

function showTooltip(name, e) {
  tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerText = name;
  document.body.appendChild(tooltip);
}

function hideTooltip() {
  if (tooltip) tooltip.remove();
}

document.getElementById("clearCanvas").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history = []; // reset undo history
};

// SAVE
document.getElementById("save").onclick = () => {
  let data = canvas.toDataURL();
  let type = classify();
  let name = prompt("Name your blub:");

  createBlub(data, type, name);

  blubs.push({ data, type, name });
  localStorage.setItem("blubs", JSON.stringify(blubs));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// LOAD
window.onload = () => {
  blubs.forEach(b => createBlub(b.data, b.type, b.name));
};


document.getElementById("clearAllBtn").onclick = () => {
  blubs = [];
  localStorage.removeItem("blubs");

  const blubElements = document.querySelectorAll(".blub");
  blubElements.forEach(b => b.remove());
};

// GLOBAL UNDO
document.getElementById("globalUndoBtn").onclick = () => {
  if (blubs.length === 0) return;

  blubs.pop();

  localStorage.setItem("blubs", JSON.stringify(blubs));

  const existingBlubs = document.querySelectorAll(".blub");
  existingBlubs.forEach(b => b.remove());

  blubs.forEach(b => createBlub(b.data, b.type, b.name));
};

  // clear all blubs from screen
  const ocean = document.getElementById("ocean");
  const existingBlubs = ocean.querySelectorAll(".blub");
  existingBlubs.forEach(b => b.remove());

  // re-render remaining blubs
  blubs.forEach(b => createBlub(b.data, b.type, b.name));


