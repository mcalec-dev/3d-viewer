(() => {
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
  const borderToggle = document.getElementById("borderToggle");
  const state = window.viewerState;
  const settingsApi = window.viewerSettings;
  if (!state || !settingsApi) {
    throw new Error("viewerState and viewerSettings must be initialized before sliders.js");
  }
  function enableInlineValueEdit(sliderEl, valueEl) {
    if (!sliderEl || !valueEl) return;
    valueEl.style.cursor = "pointer";
    valueEl.title = "Click to type a value";
    valueEl.addEventListener("click", () => {
      if (valueEl.dataset.editing === "true") return;
      valueEl.dataset.editing = "true";
      const originalText = valueEl.textContent;
      const input = document.createElement("input");
      input.type = "number";
      input.min = sliderEl.min;
      input.max = sliderEl.max;
      input.step = sliderEl.step || "1";
      input.value = sliderEl.value;
      input.style.width = "5.5rem";
      input.style.padding = "0.1rem 0.25rem";
      input.style.borderRadius = "0.25rem";
      input.style.color = "#111827";
      valueEl.textContent = "";
      valueEl.appendChild(input);
      input.focus();
      input.select();
      const endEdit = (commit) => {
        if (commit) {
          const parsed = parseFloat(input.value);
          if (Number.isFinite(parsed)) {
            let next = settingsApi.clampToSliderRange(parsed, sliderEl);
            next = settingsApi.snapToSliderStep(next, sliderEl);
            next = settingsApi.clampToSliderRange(next, sliderEl);
            sliderEl.value = settingsApi.formatForSlider(next, sliderEl);
            sliderEl.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
        if (valueEl.contains(input)) {
          valueEl.removeChild(input);
        }
        if (valueEl.textContent === "") {
          valueEl.textContent = originalText;
        }
        delete valueEl.dataset.editing;
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          endEdit(true);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          endEdit(false);
        }
      });
      input.addEventListener("blur", () => endEdit(true));
    });
  }
  function updatePerspective(containerEl) {
    if (!containerEl) return;
    containerEl.style.perspective = state.PERSPECTIVE + "px";
  }
  function applyBorderSettings(cubeEl) {
    if (!cubeEl) return;
    const enabled = Boolean(state.border && state.border.enabled);
    const color = state.border && state.border.color ? state.border.color : "#000000";
    const width =
      state.border && Number.isFinite(parseFloat(state.border.width))
        ? parseFloat(state.border.width)
        : 1;
    cubeEl.style.setProperty("--face-border-color", color);
    cubeEl.style.setProperty("--face-border-width", `${width}px`);
    cubeEl.classList.toggle("show-borders", enabled);
  }
  function updateCardDimensions(cubeEl) {
    if (!cubeEl || !sliders.width) return;
    const width = parseFloat(sliders.width.value);
    const height = parseFloat(sliders.height.value);
    const depth = parseFloat(sliders.depth.value);
    const halfD = depth / 2;
    const halfH = height / 2;
    const halfW = width / 2;
    const centerFace = (faceEl, faceWidth, faceHeight) => {
      if (!faceEl) return;
      faceEl.style.width = faceWidth + "px";
      faceEl.style.height = faceHeight + "px";
      faceEl.style.left = (width - faceWidth) / 2 + "px";
      faceEl.style.top = (height - faceHeight) / 2 + "px";
    };
    cubeEl.style.width = width + "px";
    cubeEl.style.height = height + "px";
    const frontFace = cubeEl.querySelector(".face.front");
    centerFace(frontFace, width, height);
    if (frontFace) frontFace.style.transform = `translateZ(${halfD}px)`;
    const backFace = cubeEl.querySelector(".face.back");
    centerFace(backFace, width, height);
    if (backFace) backFace.style.transform = `rotateY(180deg) translateZ(${halfD}px)`;
    const topFace = cubeEl.querySelector(".face.top");
    centerFace(topFace, width, depth);
    if (topFace) topFace.style.transform = `rotateX(90deg) translateZ(${halfH}px)`;
    const bottomFace = cubeEl.querySelector(".face.bottom");
    centerFace(bottomFace, width, depth);
    if (bottomFace) bottomFace.style.transform = `rotateX(-90deg) translateZ(${halfH}px)`;

    const rightFace = cubeEl.querySelector(".face.right");
    centerFace(rightFace, depth, height);
    if (rightFace) rightFace.style.transform = `rotateY(90deg) translateZ(${halfW}px)`;
    const leftFace = cubeEl.querySelector(".face.left");
    centerFace(leftFace, depth, height);
    if (leftFace) leftFace.style.transform = `rotateY(-90deg) translateZ(${halfW}px)`;
  }
  async function init(containerEl, cubeEl) {
    const defaults = await settingsApi.ensureDefaultsLoaded();
    settingsApi.applyDefaultsToState(state, defaults);
    settingsApi.applyDefaultsToSliders(sliders, defaults);
    settingsApi.restoreSliderSettings(sliders, (stored) => {
      if (stored.border && typeof stored.border === "object") {
        if (Object.prototype.hasOwnProperty.call(stored.border, "enabled")) {
          const raw = stored.border.enabled;
          state.border.enabled = raw === true || raw === "true";
        }
        if (typeof stored.border.color === "string" && stored.border.color.trim() !== "") {
          state.border.color = stored.border.color;
        }
        const storedWidth = parseFloat(stored.border.width);
        if (Number.isFinite(storedWidth) && storedWidth >= 0) {
          state.border.width = storedWidth;
        }
      } else if (Object.prototype.hasOwnProperty.call(stored, "showBorders")) {
        // Backward compatibility for previously persisted shape.
        const raw = stored.showBorders;
        state.border.enabled = raw === true || raw === "true";
      }
    });
    settingsApi.syncRuntimeFromSliders(sliders, state);
    if (!state.border || typeof state.border !== "object") {
      state.border = {
        enabled: defaults.border.enabled,
        color: defaults.border.color,
        width: defaults.border.width,
      };
    }

    const persistSettings = () => {
      settingsApi.saveSliderSettings(sliders, {
        border: {
          enabled: state.border.enabled,
          color: state.border.color,
          width: state.border.width,
        },
      });
    };

    const target = state.target;
    window.sliders = {
      get SMOOTHING() {
        return state.SMOOTHING;
      },
      set SMOOTHING(v) {
        state.SMOOTHING = v;
      },
      get SENSITIVITY() {
        return state.SENSITIVITY;
      },
      set SENSITIVITY(v) {
        state.SENSITIVITY = v;
      },
      get PERSPECTIVE() {
        return state.PERSPECTIVE;
      },
      set PERSPECTIVE(v) {
        state.PERSPECTIVE = v;
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
    if (borderToggle) borderToggle.checked = Boolean(state.border.enabled);
    sliders.width.addEventListener("input", (e) => {
      if (valueDisplays.width) valueDisplays.width.textContent = e.target.value;
      updateCardDimensions(cubeEl);
      persistSettings();
    });
    sliders.height.addEventListener("input", (e) => {
      if (valueDisplays.height) valueDisplays.height.textContent = e.target.value;
      updateCardDimensions(cubeEl);
      persistSettings();
    });
    sliders.depth.addEventListener("input", (e) => {
      if (valueDisplays.depth) valueDisplays.depth.textContent = e.target.value;
      updateCardDimensions(cubeEl);
      persistSettings();
    });
    sliders.smoothness.addEventListener("input", (e) => {
      if (valueDisplays.smoothness)
        valueDisplays.smoothness.textContent = e.target.value;
      state.SMOOTHING = parseFloat(e.target.value);
      persistSettings();
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
      persistSettings();
    });
    sliders.scale.addEventListener("input", (e) => {
      if (valueDisplays.scale) valueDisplays.scale.textContent = e.target.value;
      target.s = parseFloat(e.target.value);
      persistSettings();
    });
    sliders.sensitivity.addEventListener("input", (e) => {
      if (valueDisplays.sensitivity)
        valueDisplays.sensitivity.textContent = e.target.value + "%";
      state.SENSITIVITY = parseFloat(e.target.value);
      persistSettings();
    });
    sliders.perspective.addEventListener("input", (e) => {
      if (valueDisplays.perspective)
        valueDisplays.perspective.textContent = e.target.value + "px";
      state.PERSPECTIVE = parseFloat(e.target.value);
      updatePerspective(containerEl);
      persistSettings();
    });
    if (borderToggle) {
      borderToggle.addEventListener("input", (e) => {
        state.border.enabled = e.target.checked;
        applyBorderSettings(cubeEl);
        persistSettings();
      });
    }
    enableInlineValueEdit(sliders.width, valueDisplays.width);
    enableInlineValueEdit(sliders.height, valueDisplays.height);
    enableInlineValueEdit(sliders.depth, valueDisplays.depth);
    enableInlineValueEdit(sliders.smoothness, valueDisplays.smoothness);
    enableInlineValueEdit(sliders.zoom, valueDisplays.zoom);
    enableInlineValueEdit(sliders.scale, valueDisplays.scale);
    enableInlineValueEdit(sliders.sensitivity, valueDisplays.sensitivity);
    enableInlineValueEdit(sliders.perspective, valueDisplays.perspective);

    updateCardDimensions(cubeEl);
    updatePerspective(containerEl);
    applyBorderSettings(cubeEl);
  }
  window.initSliders = init;
})();
