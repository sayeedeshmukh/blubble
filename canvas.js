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
  ctx.fillStyle = fillColor.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

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
let isDragging = false, offsetX, offsetY;

panel.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  panel.style.left = e.pageX - offsetX + "px";
  panel.style.top = e.pageY - offsetY + "px";
});

document.addEventListener("mouseup", () => isDragging = false);

// CLASSIFICATION
function classify() {
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;

  for (let i = 0; i < imgData.data.length; i += 4) {
    if (imgData.data[i] !== 255) count++;
  }

  return count > 3000 ? "animal" : "coral";
}

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

// DELETE MODE
document.getElementById("deleteModeBtn").onclick = () => {
  deleteMode = !deleteMode;
};

// CLEAR ALL
document.getElementById("clearAllBtn").onclick = () => {
  localStorage.clear();
  location.reload();
};

// GLOBAL UNDO
document.getElementById("globalUndoBtn").onclick = () => {
  blubs.pop();
  localStorage.setItem("blubs", JSON.stringify(blubs));
  location.reload();
};

