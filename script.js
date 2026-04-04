const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let tool = "brush";
let history = [];
let blubs = JSON.parse(localStorage.getItem("blubs")) || [];
let deleteMode = false;
let hasUnsavedBlubs = blubs.length > 0;

// COLORS
const brushColor = document.getElementById("brushColor");
const fillColor = document.getElementById("fillColor");

function setTool(name) {
  tool = name;
  if (name === "fill") {
    canvas.style.cursor = "cell";
  } else if (name === "eraser") {
    canvas.style.cursor = "grab";
  } else {
    canvas.style.cursor = "crosshair";
  }
}

document.getElementById("brush").onclick  = () => setTool("brush");
document.getElementById("eraser").onclick = () => setTool("eraser");
document.getElementById("fill").onclick   = () => setTool("fill");

canvas.addEventListener("mousedown", (e) => {
  if (tool === "fill") {
    history.push(canvas.toDataURL());
    floodFill(e.offsetX, e.offsetY);
    return;
  }
  drawing = true;
  history.push(canvas.toDataURL());
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
  ctx.globalCompositeOperation = "source-over";
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const size = document.getElementById("brushSize").value;
  if (tool === "brush") {
    ctx.globalCompositeOperation = "source-over"; 
    ctx.strokeStyle = brushColor.value;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
  } else if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out"; 
    ctx.lineWidth = size;                              
    ctx.lineCap = "round";
  }
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

function floodFill(x, y) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const targetColor = getPixelColor(data, x, y);
  const fillCol = hexToRgb(fillColor.value);
  if (colorsMatch(targetColor, [fillCol.r, fillCol.g, fillCol.b, 255])) return;
  const stack = [[x, y]];
  const w = canvas.width, h = canvas.height;
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
    const index = (cy * w + cx) * 4;
    const cur = [data[index], data[index+1], data[index+2], data[index+3]];
    if (!colorsMatch(cur, targetColor)) continue;
    data[index]   = fillCol.r;
    data[index+1] = fillCol.g;
    data[index+2] = fillCol.b;
    data[index+3] = 255;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

function getPixelColor(data, x, y) {
  const i = (y * canvas.width + x) * 4;
  return [data[i], data[i+1], data[i+2], data[i+3]];
}
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1,3), 16),
    g: parseInt(hex.slice(3,5), 16),
    b: parseInt(hex.slice(5,7), 16)
  };
}
function colorsMatch(a, b) {
  return a[0]===b[0] && a[1]===b[1] && a[2]===b[2] && a[3]===b[3];
}

document.getElementById("undo").onclick = () => {
  if (!history.length) return;
  const img = new Image();
  img.src = history.pop();
  img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
};

document.getElementById("clearCanvas").onclick = () => {
  history.push(canvas.toDataURL());
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const panel       = document.getElementById("panel");
const minimizeBtn = document.getElementById("minimizeBtn");
const panelBody   = document.getElementById("panel-body");
let minimized = false;

minimizeBtn.addEventListener("click", () => {
  minimized = !minimized;
  if (minimized) {
    panelBody.style.display = "none";
    minimizeBtn.textContent = "▲";
  } else {
    panelBody.style.display = "";
    minimizeBtn.textContent = "▼";
  }
});

const header = document.getElementById("panel-header");
let isDragging = false, offX, offY;

header.addEventListener("mousedown", (e) => {
  if (e.target === minimizeBtn) return;
  isDragging = true;
  const rect = panel.getBoundingClientRect();
  offX = e.clientX - rect.left;
  offY = e.clientY - rect.top;
});
document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  panel.style.left = e.clientX - offX + "px";
  panel.style.top  = e.clientY - offY + "px";
});
document.addEventListener("mouseup", () => isDragging = false);

function createBlub(data, type, name) {
  const img = document.createElement("img");
  img.src = data;
  img.className = "blub";
  img.style.left = Math.random() * (window.innerWidth  - 120) + "px";
  img.style.top  = Math.random() * (window.innerHeight - 120) + "px";

  animateBlub(img, type);

  let tip = null;


//blub name  
  img.addEventListener("mouseenter", () => {
    tip = document.createElement("div");
    tip.className = "tooltip";
    tip.textContent = name;
    tip.style.position = "fixed";
    tip.style.pointerEvents = "none";
    tip.style.display = "block";
    document.body.appendChild(tip);
  });

  img.addEventListener("mousemove", (e) => {
    if (!tip) return;
    tip.style.left = (e.clientX + 14) + "px";
    tip.style.top  = (e.clientY - 10) + "px";
  });

  img.addEventListener("mouseleave", () => {
    if (tip) { tip.remove(); tip = null; }
  });

  img.addEventListener("mouseleave", () => {
    const tip = document.getElementById("active-tooltip");
    if (tip) tip.remove();
  });

  img.onclick = () => { if (deleteMode) img.remove(); };
  document.getElementById("ocean").appendChild(img);
}

function animateBlub(el, type) {
  let t = 0;

  // Random starting position and behavior
  const speed = 0.4 + Math.random() * 0.7;       
  const bobAmount = 10 + Math.random() * 20;      
  const bobSpeed = 0.02 + Math.random() * 0.02;   
  const swimSpeed = 0.4 + Math.random() * 0.5;    

  let x = Math.random() * window.innerWidth;
  let y = 80 + Math.random() * (window.innerHeight - 200);
  let direction = Math.random() < 0.5 ? 1 : -1;  // 1 = right, -1 = left

  el.style.position = "fixed";
  el.style.left = x + "px";
  el.style.top  = y + "px";

  (function move() {
    t += bobSpeed;

    // Move horizontally
    x += swimSpeed * direction;

    // Bounce off edges
    if (x > window.innerWidth - 100) {
      direction = -1;
    } else if (x < 0) {
      direction = 1;
    }

    // Vertical bob (sine wave)
    const bobY = Math.sin(t) * bobAmount;

    // Flip image based on direction
    el.style.transform = `scaleX(${direction}) translateY(${bobY}px)`;
    el.style.left = x + "px";

    requestAnimationFrame(move);
  })();
}

document.getElementById("save").onclick = () => {
  const data = canvas.toDataURL();
  const type = typeof classify === "function" ? classify() : "fish";
  const name = prompt("Name your blub:");
  if (!name) return;
  createBlub(data, type, name);
  blubs.push({ data, type, name });
  localStorage.setItem("blubs", JSON.stringify(blubs));
  history = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasUnsavedBlubs = true;
  showUnsavedBanner();
};

document.getElementById("clearAllBtn").onclick = () => {
  blubs = [];
  localStorage.removeItem("blubs");
  document.querySelectorAll(".blub").forEach(b => b.remove());
  hasUnsavedBlubs = false;
  hideUnsavedBanner();
};

document.getElementById("globalUndoBtn").onclick = () => {
  if (!blubs.length) return;
  blubs.pop();
  localStorage.setItem("blubs", JSON.stringify(blubs));
  document.querySelectorAll(".blub").forEach(b => b.remove());
  blubs.forEach(b => createBlub(b.data, b.type, b.name));
  if (!blubs.length) { hasUnsavedBlubs = false; hideUnsavedBanner(); }
};

window.onload = () => {
  blubs.forEach(b => createBlub(b.data, b.type, b.name));
  setTool("brush");
};

lucide.createIcons();


function createBubble() {
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const size = 8 + Math.random() * 30;
  const startX = Math.random() * window.innerWidth;
  const duration = 4 + Math.random() * 8; // seconds to float up
  const delay = Math.random() * 5;

  bubble.style.cssText = `
    position: fixed;
    left: ${startX}px;
    bottom: -50px;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.05));
    border: 1px solid rgba(255,255,255,0.5);
    pointer-events: none;
    z-index: 2;
    animation: floatUp ${duration}s ${delay}s linear forwards;
  `;

  document.getElementById("ocean").appendChild(bubble);

  // Remove after animation ends
  setTimeout(() => bubble.remove(), (duration + delay) * 1000);
}

// Spawn bubbles continuously
setInterval(() => createBubble(), 800);