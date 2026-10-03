const shape = document.querySelector(".shape");
const world = document.querySelector(".world");
const canvas = document.querySelector("#render");
const MAX_ZOOM = 10;
const MIN_ZOOM = -10;
const MOVE_SPEED = 240;
const SCROLL_MOVE_STEP = 30;
const state = window.viewerState;
let current = {
  rx: 0,
  ry: 0,
  s: 1,
  z: 0,
  mx: 0,
  my: 0,
  mz: 0,
};
let activeDrag = null;
let activePointerId = null;
let lastPointerPosition = null;
const heldMovementKeys = new Set();
let previousFrameTime = null;

canvas.addEventListener("pointerdown", (e) => {
  if (e.button === 0) activeDrag = "rotate";
  else if (e.button === 2) activeDrag = "pan";
  else return;
  activePointerId = e.pointerId;
  lastPointerPosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener("pointermove", (e) => {
  if (e.pointerId !== activePointerId) return;
  const slidersApi = window.sliders;
  if (!slidersApi || !slidersApi.target) return;
  const camera = slidersApi.target;
  if (activeDrag === "rotate") {
    const sensitivity = (slidersApi.SENSITIVITY || 100) / 100;
    camera.ry += e.movementX * 0.25 * sensitivity;
    camera.rx = clampPitch(camera.rx - e.movementY * 0.25 * sensitivity);
  } else if (activeDrag === "pan" && lastPointerPosition) {
    const deltaX = e.clientX - lastPointerPosition.x;
    const deltaY = e.clientY - lastPointerPosition.y;
    moveObjectByViewDelta(camera, deltaX, deltaY, 0);
    lastPointerPosition = { x: e.clientX, y: e.clientY };
  }
});

function endDrag(e) {
  if (e.pointerId !== activePointerId) return;
  activeDrag = null;
  activePointerId = null;
  lastPointerPosition = null;
  if (window.sliders && typeof window.sliders.saveSettings === "function") {
    window.sliders.saveSettings();
  }
}

window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const slidersApi = window.sliders;
  if (!slidersApi || !slidersApi.target) return;
  const direction = Math.sign(e.deltaY);
  if (direction === 0) return;
  moveCamera(slidersApi.target, 0, 0, -direction * SCROLL_MOVE_STEP);
  if (typeof slidersApi.saveSettings === "function") slidersApi.saveSettings();
});

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
  const target = e.target;
  if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|SELECT|TEXTAREA|BUTTON/.test(target.tagName))) return;
  const key = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) {
    heldMovementKeys.add(key);
    e.preventDefault();
    return;
  }
  if (e.repeat) return;
  const slidersApi = window.sliders;
  if (!slidersApi || !slidersApi.target) return;
  const camera = slidersApi.target;
  let handled = true;
  switch (key) {
    case "i":
      camera.z = Math.min(MAX_ZOOM, camera.z + 0.25);
      if (typeof slidersApi.syncZoomSlider === "function") slidersApi.syncZoomSlider(camera.z);
      break;
    case "o":
      camera.z = Math.max(MIN_ZOOM, camera.z - 0.25);
      if (typeof slidersApi.syncZoomSlider === "function") slidersApi.syncZoomSlider(camera.z);
      break;
    case "r":
      if (typeof slidersApi.resetCamera === "function") slidersApi.resetCamera();
      break;
    case "b":
      if (typeof slidersApi.toggleBorders === "function") slidersApi.toggleBorders();
      break;
    case "l":
      if (typeof slidersApi.toggleLighting === "function") slidersApi.toggleLighting();
      break;
    default:
      handled = false;
  }
  if (!handled) return;
  e.preventDefault();
  if (typeof slidersApi.saveSettings === "function") slidersApi.saveSettings();
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (!heldMovementKeys.delete(key)) return;
  if (window.sliders && typeof window.sliders.saveSettings === "function") {
    window.sliders.saveSettings();
  }
});

window.addEventListener("blur", () => {
  if (heldMovementKeys.size === 0) return;
  heldMovementKeys.clear();
  if (window.sliders && typeof window.sliders.saveSettings === "function") {
    window.sliders.saveSettings();
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

function moveObjectByViewDelta(target, deltaX, deltaY, deltaZ) {
  const yaw = (current.ry * Math.PI) / 180;
  const pitch = (current.rx * Math.PI) / 180;
  const sinYaw = Math.sin(yaw);
  const cosYaw = Math.cos(yaw);
  const sinPitch = Math.sin(pitch);
  const cosPitch = Math.cos(pitch);
  target.mx += deltaX * cosYaw + deltaY * sinYaw * sinPitch - deltaZ * sinYaw * cosPitch;
  target.my += deltaY * cosPitch + deltaZ * sinPitch;
  target.mz += deltaX * sinYaw - deltaY * cosYaw * sinPitch + deltaZ * cosYaw * cosPitch;
}

function moveCamera(target, deltaX, deltaY, deltaZ) {
  moveObjectByViewDelta(target, -deltaX, -deltaY, deltaZ);
}

function getCameraWorldPosition(rx, ry, zoomOffset, perspective, mx, my, mz) {
  const pitch = (rx * Math.PI) / 180;
  const yaw = (ry * Math.PI) / 180;
  const distance = perspective - zoomOffset;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  return {
    x: -sinYaw * cosPitch * distance - mx,
    y: sinPitch * distance - my,
    z: cosYaw * cosPitch * distance - mz,
  };
}

function updateLightingFaces(rx, ry) {
  const lighting = state && state.lighting;
  if (!lighting) return;
  const azimuth = (lighting.azimuth * Math.PI) / 180;
  const elevation = (lighting.elevation * Math.PI) / 180;
  const light = {
    x: Math.cos(elevation) * Math.sin(azimuth),
    y: -Math.sin(elevation),
    z: Math.cos(elevation) * Math.cos(azimuth),
  };
  const rotationX = (rx * Math.PI) / 180;
  const rotationY = (ry * Math.PI) / 180;
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  shape.querySelectorAll(".face").forEach((face) => {
    const normal = face.dataset.normal.split(",").map(Number);
    const rotatedX = cosY * normal[0] + sinY * normal[2];
    const rotatedY = normal[1];
    const rotatedZ = -sinY * normal[0] + cosY * normal[2];
    const worldY = cosX * rotatedY - sinX * rotatedZ;
    const worldZ = sinX * rotatedY + cosX * rotatedZ;
    const diffuse = Math.max(0, rotatedX * light.x + worldY * light.y + worldZ * light.z);
    face.style.setProperty("--face-light-factor", String(0.2 + diffuse * 0.8));
  });
}

function frame(timestamp) {
  const slidersApi = window.sliders;
  if (!slidersApi || typeof slidersApi.SMOOTHING !== "number" || !slidersApi.target) {
    requestAnimationFrame(frame);
    return;
  }
  const deltaTime = previousFrameTime === null ? 0 : Math.min((timestamp - previousFrameTime) / 1000, 0.1);
  previousFrameTime = timestamp;
  const smoothing = slidersApi.SMOOTHING;
  const effectiveTarget = slidersApi.target;
  if (deltaTime > 0 && heldMovementKeys.size > 0) {
    let moveX = Number(heldMovementKeys.has("d")) - Number(heldMovementKeys.has("a"));
    let moveZ = Number(heldMovementKeys.has("w")) - Number(heldMovementKeys.has("s"));
    const magnitude = Math.hypot(moveX, moveZ) || 1;
    moveX = (moveX / magnitude) * MOVE_SPEED * deltaTime;
    moveZ = (moveZ / magnitude) * MOVE_SPEED * deltaTime;
    moveCamera(effectiveTarget, moveX, 0, moveZ);
  }
  current.rx = lerp(current.rx, effectiveTarget.rx || 0, smoothing);
  current.ry = lerpCircular(current.ry, effectiveTarget.ry || 0, smoothing, 360);
  current.s = lerp(current.s, effectiveTarget.s || 1, smoothing);
  current.z = lerp(current.z, Number.isFinite(effectiveTarget.z) ? effectiveTarget.z : 0, smoothing);
  current.mx = lerp(current.mx, effectiveTarget.mx || 0, smoothing);
  current.my = lerp(current.my, effectiveTarget.my || 0, smoothing);
  current.mz = lerp(current.mz, effectiveTarget.mz || 0, smoothing);
  const zoomFactor = Math.pow(10, current.z / 10);
  const zoomOffset = state.PERSPECTIVE * (1 - 1 / zoomFactor);
  const displayYaw = normalizeYaw(current.ry);
  const cameraPosition = getCameraWorldPosition(
    current.rx,
    displayYaw,
    zoomOffset,
    state.PERSPECTIVE,
    current.mx,
    current.my,
    current.mz,
  );
  world.style.transform = `
    translateZ(${zoomOffset}px)
    rotateX(${current.rx}deg)
    rotateY(${displayYaw}deg)
    translate3d(${current.mx}px, ${current.my}px, ${current.mz}px)
  `;
  shape.style.transform = `scale3d(${current.s}, ${current.s}, ${current.s})`;
  updateLightingFaces(current.rx, displayYaw);
  if (window.infoDisplay && typeof window.infoDisplay.update === "function") {
    window.infoDisplay.update({
      rx: -current.rx,
      ry: displayYaw,
      s: current.s,
      z: current.z,
      cameraPosition,
      worldOffset: { x: current.mx, y: current.my, z: current.mz },
    });
  }
  requestAnimationFrame(frame);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (window.initSliders) {
      await window.shapeViewer.initialize(shape);
      await window.initSliders(world, shape);
      window.sliders.updateShapeDimensions();
      if (state && state.target) {
        current = {
          rx: state.target.rx,
          ry: state.target.ry,
          s: state.target.s,
          z: state.target.z,
          mx: state.target.mx || 0,
          my: state.target.my || 0,
          mz: state.target.mz || 0,
        };
      }
    }
  } catch (err) {
    console.error("Failed to initialize viewer:", err);
  }
  requestAnimationFrame(frame);
});
