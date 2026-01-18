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
let SMOOTHING = 0.33;
let SENSITIVITY = 100;
let PERSPECTIVE = 1200;
let target = { rx: -25, ry: -47.5, s: 1, z: 1 };
function updatePerspective(containerEl) {
  if (!containerEl) return;
  containerEl.style.perspective = PERSPECTIVE + "px";
}
function updateCardDimensions(cubeEl) {
  if (!cubeEl || !sliders.width) return;
  const width = sliders.width.value;
  const height = sliders.height.value;
  const depth = sliders.depth.value;
  const halfD = depth / 2;
  const halfH = height / 2;
  const halfW = width / 2;
  cubeEl.style.width = width + "px";
  cubeEl.style.height = height + "px";
  const frontFace = cubeEl.querySelector(".face.front");
  frontFace.style.width = width + "px";
  frontFace.style.height = height + "px";
  frontFace.style.transform = `translateZ(${halfD}px)`;
  const backFace = cubeEl.querySelector(".face.back");
  backFace.style.width = width + "px";
  backFace.style.height = height + "px";
  backFace.style.transform = `rotateY(180deg) translateZ(${halfD}px)`;
  const topFace = cubeEl.querySelector(".face.top");
  topFace.style.width = width + "px";
  topFace.style.height = depth + "px";
  topFace.style.transform = `rotateX(90deg) translateZ(${halfD}px)`;
  const bottomFace = cubeEl.querySelector(".face.bottom");
  bottomFace.style.width = width + "px";
  bottomFace.style.height = depth + "px";
  bottomFace.style.transform = `rotateX(-90deg) translateZ(${
    -halfD - -halfH * 2
  }px)`;
  const rightFace = cubeEl.querySelector(".face.right");
  rightFace.style.width = depth + "px";
  rightFace.style.height = height + "px";
  rightFace.style.transform = `rotateY(90deg) translateZ(${
    -halfD - -halfW * 2
  }px)`;
  const leftFace = cubeEl.querySelector(".face.left");
  leftFace.style.width = depth + "px";
  leftFace.style.height = height + "px";
  leftFace.style.transform = `rotateY(-90deg) translateZ(${halfD}px)`;
}
function init(containerEl, cubeEl) {
  window.sliders = {
    get SMOOTHING() {
      return SMOOTHING;
    },
    set SMOOTHING(v) {
      SMOOTHING = v;
    },
    get SENSITIVITY() {
      return SENSITIVITY;
    },
    set SENSITIVITY(v) {
      SENSITIVITY = v;
    },
    get PERSPECTIVE() {
      return PERSPECTIVE;
    },
    set PERSPECTIVE(v) {
      PERSPECTIVE = v;
    },
    target,
    updateCardDimensions: () => updateCardDimensions(cubeEl),
    updatePerspective: () => updatePerspective(containerEl),
    updateZoomDisplay: (z) => {
      if (valueDisplays.zoom) {
        try {
          valueDisplays.zoom.textContent = parseFloat(z).toFixed(2);
        } catch (e) {
          valueDisplays.zoom.textContent = z;
        }
      }
    },
  };
  if (!sliders.width) return;
  if (valueDisplays.width)
    valueDisplays.width.textContent = sliders.width.value;
  if (valueDisplays.height)
    valueDisplays.height.textContent = sliders.height.value;
  if (valueDisplays.depth)
    valueDisplays.depth.textContent = sliders.depth.value;
  if (valueDisplays.smoothness)
    valueDisplays.smoothness.textContent = sliders.smoothness.value;
  if (valueDisplays.zoom) valueDisplays.zoom.textContent = sliders.zoom.value;
  if (valueDisplays.scale)
    valueDisplays.scale.textContent = sliders.scale.value;
  if (valueDisplays.sensitivity)
    valueDisplays.sensitivity.textContent = sliders.sensitivity.value + "%";
  if (valueDisplays.perspective)
    valueDisplays.perspective.textContent = sliders.perspective.value + "px";
  sliders.width.addEventListener("input", (e) => {
    if (valueDisplays.width) valueDisplays.width.textContent = e.target.value;
    updateCardDimensions(cubeEl);
  });
  sliders.height.addEventListener("input", (e) => {
    if (valueDisplays.height) valueDisplays.height.textContent = e.target.value;
    updateCardDimensions(cubeEl);
  });
  sliders.depth.addEventListener("input", (e) => {
    if (valueDisplays.depth) valueDisplays.depth.textContent = e.target.value;
    updateCardDimensions(cubeEl);
  });
  sliders.smoothness.addEventListener("input", (e) => {
    if (valueDisplays.smoothness)
      valueDisplays.smoothness.textContent = e.target.value;
    SMOOTHING = parseFloat(e.target.value);
  });
  sliders.zoom.addEventListener("input", (e) => {
    if (valueDisplays.zoom) valueDisplays.zoom.textContent = e.target.value;
    target.z = parseFloat(e.target.value);
    if (
      window.sliders &&
      typeof window.sliders.updateZoomDisplay === "function"
    ) {
      window.sliders.updateZoomDisplay(target.z);
    }
  });
  sliders.scale.addEventListener("input", (e) => {
    if (valueDisplays.scale) valueDisplays.scale.textContent = e.target.value;
    target.s = parseFloat(e.target.value);
  });
  sliders.sensitivity.addEventListener("input", (e) => {
    if (valueDisplays.sensitivity)
      valueDisplays.sensitivity.textContent = e.target.value + "%";
    SENSITIVITY = parseFloat(e.target.value);
  });
  sliders.perspective.addEventListener("input", (e) => {
    if (valueDisplays.perspective)
      valueDisplays.perspective.textContent = e.target.value + "px";
    PERSPECTIVE = parseFloat(e.target.value);
    updatePerspective(containerEl);
  });
  updateCardDimensions(cubeEl);
  updatePerspective(containerEl);
}
window.initSliders = init;
