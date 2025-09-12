const card = document.querySelector(".steam-card");
const MAX_ZOOM = 8;
const MIN_ZOOM = 0.5;
let SMOOTHING = 0.12;
let target = { rx: -25, ry: -47, s: 1 };
let current = { rx: 0, ry: 0, s: 1 };
let isDragging = false;
const sliders = {
  width: document.getElementById("cardWidth"),
  height: document.getElementById("cardHeight"),
  depth: document.getElementById("cardDepth"),
  smoothness: document.getElementById("smoothness"),
  zoom: document.getElementById("zoom"),
};
const valueDisplays = {
  width: document.getElementById("widthValue"),
  height: document.getElementById("heightValue"),
  depth: document.getElementById("depthValue"),
  smoothness: document.getElementById("smoothnessValue"),
  zoom: document.getElementById("zoomValue"),
};
function updateCardDimensions() {
  const width = parseFloat(sliders.width.value);
  const height = parseFloat(sliders.height.value);
  const depth = parseFloat(sliders.depth.value);

  const halfD = depth / 2;
  const halfH = height / 2;
  const halfW = width / 2;

  card.style.width = width + "px";
  card.style.height = height + "px";

  // Front face
  const frontFace = card.querySelector(".face.front");
  frontFace.style.width = width + "px";
  frontFace.style.height = height + "px";
  frontFace.style.transform = `translateZ(${halfD}px)`;

  // Back face
  const backFace = card.querySelector(".face.back");
  backFace.style.width = width + "px";
  backFace.style.height = height + "px";
  backFace.style.transform = `rotateY(180deg) translateZ(${halfD}px)`;

  // Top face
  const topFace = card.querySelector(".face.top");
  topFace.style.width = width + "px";
  topFace.style.height = depth + "px";
  topFace.style.transform = `rotateX(90deg) translateZ(${halfD}px)`;

  // Bottom face
  const bottomFace = card.querySelector(".face.bottom");
  bottomFace.style.width = width + "px";
  bottomFace.style.height = depth + "px";
  bottomFace.style.transform = `rotateX(-90deg) translateZ(${
    -halfD - -halfH * 2
  }px)`;

  // Right face
  const rightFace = card.querySelector(".face.right");
  rightFace.style.width = depth + "px";
  rightFace.style.height = height + "px";
  rightFace.style.transform = `rotateY(90deg) translateZ(${
    -halfD - -halfW * 2
  }px)`;

  // Left face
  const leftFace = card.querySelector(".face.left");
  leftFace.style.width = depth + "px";
  leftFace.style.height = height + "px";
  leftFace.style.transform = `rotateY(-90deg) translateZ(${halfD}px)`;
}
sliders.width.addEventListener("input", (e) => {
  valueDisplays.width.textContent = e.target.value;
  updateCardDimensions();
});
sliders.height.addEventListener("input", (e) => {
  valueDisplays.height.textContent = e.target.value;
  updateCardDimensions();
});
sliders.depth.addEventListener("input", (e) => {
  valueDisplays.depth.textContent = e.target.value;
  updateCardDimensions();
});
sliders.smoothness.addEventListener("input", (e) => {
  valueDisplays.smoothness.textContent = e.target.value;
  SMOOTHING = parseFloat(e.target.value);
});
sliders.zoom.addEventListener("input", (e) => {
  valueDisplays.zoom.textContent = e.target.value;
  target.s = parseFloat(e.target.value);
});
card.addEventListener("mousedown", () => {
  isDragging = true;
  card.requestPointerLock();
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  target.ry += e.movementX * 0.25;
  target.rx -= e.movementY * 0.25;
});
function stopDragging() {
  if (!isDragging) return;
  isDragging = false;
  document.exitPointerLock();
}
window.addEventListener("mouseup", stopDragging);
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== card) stopDragging();
});
card.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
  target.s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target.s + zoomDelta));
  if (valueDisplays.zoom) {
    valueDisplays.zoom.textContent = target.s.toFixed(2);
  }
});
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function cubic(i) {
  const t = (i - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const c = Math.max(0, Math.min(1, t));
  const e = 1 - Math.pow(1 - c, 3);
  return MIN_ZOOM + e * (MAX_ZOOM - MIN_ZOOM);
}
function frame() {
  current.rx = lerp(current.rx, target.rx, SMOOTHING);
  current.ry = lerp(current.ry, target.ry, SMOOTHING);
  current.s = lerp(current.s, target.s, SMOOTHING);
  card.style.transform = `
    rotateX(${current.rx}deg)
    rotateY(${current.ry}deg)
  `;
  card.style.zoom = cubic(current.s);
  requestAnimationFrame(frame);
}

document.addEventListener("DOMContentLoaded", async () => {
  updateCardDimensions();
  if (valueDisplays.zoom) {
    valueDisplays.zoom.textContent = target.s.toFixed(2);
  }
  if (sliders.zoom) {
    sliders.zoom.value = target.s;
  }
  requestAnimationFrame(frame);
});
