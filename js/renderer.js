const cube = document.querySelector(".cube");
const cubeContainer = document.querySelector(".cube-container");
const MAX_ZOOM = 10;
const MIN_ZOOM = 1;
const state = window.viewerState;
let current = { rx: 0, ry: 0, s: 1, z: 1 };
let isDragging = false;
cube.addEventListener("mousedown", () => {
  isDragging = true;
  cube.requestPointerLock();
});
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const slidersApi = window.sliders;
  if (!slidersApi || typeof slidersApi.SENSITIVITY !== "number" || !slidersApi.target) {
    return;
  }
  const sensitivity = slidersApi.SENSITIVITY;
  const sensitivityMultiplier = sensitivity / 100;
  const t = slidersApi.target;
  t.ry += e.movementX * 0.25 * sensitivityMultiplier;
  t.rx -= e.movementY * 0.25 * sensitivityMultiplier;
  t.rx = clampPitch(t.rx);
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
  const slidersApi = window.sliders;
  if (!slidersApi || !slidersApi.target) return;
  const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
  const t = slidersApi.target;
  t.z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, t.z + zoomDelta));
  if (slidersApi && typeof slidersApi.updateZoomDisplay === "function") {
    slidersApi.updateZoomDisplay(t.z);
  } else {
    const zoomDisplay = document.getElementById("zoomValue");
    if (zoomDisplay) zoomDisplay.textContent = t.z.toFixed(2);
  }
});
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpCircular(a, b, t, maxValue = 360) {
  let delta = b - a;
  if (Math.abs(delta) > maxValue / 2) {
    if (delta > 0) {
      delta -= maxValue;
    } else {
      delta += maxValue;
    }
  }
  return a + delta * t;
}
function normalizeYaw(degrees) {
  return ((degrees % 360) + 360) % 360;
}
function clampPitch(degrees) {
  return Math.max(-90, Math.min(90, degrees));
}
function frame() {
  const slidersApi = window.sliders;
  if (!slidersApi || typeof slidersApi.SMOOTHING !== "number" || !slidersApi.target) {
    requestAnimationFrame(frame);
    return;
  }
  const smoothing = slidersApi.SMOOTHING;
  const effectiveTarget = slidersApi.target;
  current.rx = lerp(current.rx, effectiveTarget.rx || 0, smoothing);
  current.ry = lerpCircular(current.ry, effectiveTarget.ry || 0, smoothing, 360);
  current.s = lerp(current.s, effectiveTarget.s || 1, smoothing);
  current.z = lerp(current.z, effectiveTarget.z || 1, smoothing);
  const displayYaw = normalizeYaw(current.ry);
  cube.style.transform = `
    rotateX(${current.rx}deg)
    rotateY(${displayYaw}deg)
    scale3d(${current.s}, ${current.s}, ${current.s})
  `;
  cube.style.zoom = current.z;
  if (window.infoDisplay && typeof window.infoDisplay.update === "function") {
    window.infoDisplay.update({ rx: current.rx, ry: displayYaw, s: current.s, z: current.z });
  }
  requestAnimationFrame(frame);
}
document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (window.initSliders) {
      const cubeContainer = document.querySelector(".cube-container");
      await window.initSliders(cubeContainer, cube);
      if (state && state.target) {
        current = {
          rx: state.target.rx,
          ry: state.target.ry,
          s: state.target.s,
          z: state.target.z,
        };
      }
    }
  } catch (err) {
    console.error("Failed to initialize sliders module:", err);
  }
  requestAnimationFrame(frame);
});
