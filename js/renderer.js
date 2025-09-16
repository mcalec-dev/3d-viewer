const cube = document.querySelector(".cube");
const cubeContainer = document.querySelector(".cube-container");
const MAX_ZOOM = 10;
const MIN_ZOOM = 1;
let SMOOTHING = 0.33;
let SENSITIVITY = 100;
let PERSPECTIVE = 1200;
let target = { rx: -25, ry: -47, s: 1, z: 1 };
let current = { rx: 0, ry: 0, s: 1, z: 1 };
let isDragging = false;
const sliders = {
  width: document.getElementById("cubeWidth"),
  height: document.getElementById("cubeHeight"),
  depth: document.getElementById("cubeDepth"),
  smoothness: document.getElementById("smoothness"),
  zoom: document.getElementById("zoom"),
  scale: document.getElementById("scale"),
  sensitivity: document.getElementById("sensitivity"),
  perspective: document.getElementById("perspective"),
};
const valueDisplays = {
  width: document.getElementById("widthValue"),
  height: document.getElementById("heightValue"),
  depth: document.getElementById("depthValue"),
  smoothness: document.getElementById("smoothnessValue"),
  zoom: document.getElementById("zoomValue"),
  scale: document.getElementById("scaleValue"),
  sensitivity: document.getElementById("sensitivityValue"),
  perspective: document.getElementById("perspectiveValue"),
};
function updatePerspective() {
  cubeContainer.style.perspective = PERSPECTIVE + "px";
}
function updateCardDimensions() {
  const width = sliders.width.value;
  const height = sliders.height.value;
  const depth = sliders.depth.value;
  const halfD = depth / 2;
  const halfH = height / 2;
  const halfW = width / 2;
  cube.style.width = width + "px";
  cube.style.height = height + "px";
  const frontFace = cube.querySelector(".face.front");
  frontFace.style.width = width + "px";
  frontFace.style.height = height + "px";
  frontFace.style.transform = `translateZ(${halfD}px)`;
  const backFace = cube.querySelector(".face.back");
  backFace.style.width = width + "px";
  backFace.style.height = height + "px";
  backFace.style.transform = `rotateY(180deg) translateZ(${halfD}px)`;
  const topFace = cube.querySelector(".face.top");
  topFace.style.width = width + "px";
  topFace.style.height = depth + "px";
  topFace.style.transform = `rotateX(90deg) translateZ(${halfD}px)`;
  const bottomFace = cube.querySelector(".face.bottom");
  bottomFace.style.width = width + "px";
  bottomFace.style.height = depth + "px";
  bottomFace.style.transform = `rotateX(-90deg) translateZ(${
    -halfD - -halfH * 2
  }px)`;
  const rightFace = cube.querySelector(".face.right");
  rightFace.style.width = depth + "px";
  rightFace.style.height = height + "px";
  rightFace.style.transform = `rotateY(90deg) translateZ(${
    -halfD - -halfW * 2
  }px)`;
  const leftFace = cube.querySelector(".face.left");
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
  target.z = parseFloat(e.target.value);
});
sliders.scale.addEventListener("input", (e) => {
  valueDisplays.scale.textContent = e.target.value;
  target.s = parseFloat(e.target.value);
});
sliders.sensitivity.addEventListener("input", (e) => {
  valueDisplays.sensitivity.textContent = e.target.value + "%";
  SENSITIVITY = parseFloat(e.target.value);
});
sliders.perspective.addEventListener("input", (e) => {
  valueDisplays.perspective.textContent = e.target.value + "px";
  PERSPECTIVE = parseFloat(e.target.value);
  updatePerspective();
});
cube.addEventListener("mousedown", () => {
  isDragging = true;
  cube.requestPointerLock();
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const sensitivityMultiplier = SENSITIVITY / 100;
  target.ry += e.movementX * 0.25 * sensitivityMultiplier;
  target.rx -= e.movementY * 0.25 * sensitivityMultiplier;
});
function stopDragging() {
  if (!isDragging) return;
  isDragging = false;
  document.exitPointerLock();
}
window.addEventListener("mouseup", stopDragging);
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== cube) stopDragging();
});
cube.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
  target.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target.z + zoomDelta));
  if (valueDisplays.zoom) {
    valueDisplays.zoom.textContent = target.z.toFixed(2);
  }
});
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function frame() {
  current.rx = lerp(current.rx, target.rx, SMOOTHING);
  current.ry = lerp(current.ry, target.ry, SMOOTHING);
  current.s = lerp(current.s, target.s, SMOOTHING);
  current.z = lerp(current.z, target.z, SMOOTHING);
  cube.style.transform = `
    rotateX(${current.rx}deg)
    rotateY(${current.ry}deg)
    scale3d(${current.s}, ${current.s}, ${current.s})
  `;
  cube.style.zoom = current.z;
  requestAnimationFrame(frame);
}
document.addEventListener("DOMContentLoaded", async () => {
  updateCardDimensions();
  updatePerspective();
  requestAnimationFrame(frame);
});
