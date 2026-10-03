(() => {
  const sliders = {
    width: document.getElementById("shapeWidth"),
    height: document.getElementById("shapeHeight"),
    depth: document.getElementById("shapeDepth"),
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
  const borderColor = document.getElementById("borderColor");
  const borderWidthValue = document.getElementById("borderWidthValue");
  const gridControls = {
    xy: document.getElementById("gridXY"),
    xz: document.getElementById("gridXZ"),
    yz: document.getElementById("gridYZ"),
  };
  const lightingControls = {
    enabled: document.getElementById("lightingEnabled"),
    color: document.getElementById("lightingColor"),
    intensity: document.getElementById("lightingIntensity"),
    azimuth: document.getElementById("lightingAzimuth"),
    elevation: document.getElementById("lightingElevation"),
    softness: document.getElementById("lightingSoftness"),
  };
  const lightingDisplays = {
    intensity: document.getElementById("lightingIntensityValue"),
    azimuth: document.getElementById("lightingAzimuthValue"),
    elevation: document.getElementById("lightingElevationValue"),
    softness: document.getElementById("lightingSoftnessValue"),
  };
  const settingsPanel = document.getElementById("sliders");
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsToggleLabel = document.getElementById("settings-toggle-label");
  const state = window.viewerState;
  const settingsApi = window.viewerSettings;
  if (!state || !settingsApi) {
    throw new Error("viewerState and viewerSettings must be initialized before sliders.js");
  }
  if (settingsPanel && settingsToggle) {
    settingsToggle.addEventListener("click", () => {
      const expanded = settingsToggle.getAttribute("aria-expanded") === "true";
      settingsPanel.hidden = expanded;
      settingsToggle.setAttribute("aria-expanded", String(!expanded));
      const label = expanded ? "Show settings" : "Hide settings";
      settingsToggle.setAttribute("aria-label", label);
      if (settingsToggleLabel) settingsToggleLabel.textContent = label;
    });
  }
  function enableInlineValueEdit(sliderEl, valueEl, options = {}) {
    if (!valueEl || (!sliderEl && typeof options.onCommit !== "function")) return;
    valueEl.style.cursor = "pointer";
    valueEl.title = "Click to type a value";
    valueEl.addEventListener("click", () => {
      if (valueEl.dataset.editing === "true") return;
      valueEl.dataset.editing = "true";
      const originalText = valueEl.textContent;
      const input = document.createElement("input");
      input.type = "number";
      const constraints = sliderEl
        ? { min: sliderEl.min, max: sliderEl.max, step: sliderEl.step || "1" }
        : { min: options.min || "", max: options.max || "", step: options.step || "1" };
      input.min = constraints.min;
      input.max = constraints.max;
      input.step = constraints.step;
      input.value = sliderEl ? sliderEl.value : originalText;
      input.style.width = "5.5rem";
      input.style.padding = "0.1rem 0.25rem";
      input.style.borderRadius = "0.25rem";
      input.style.color = "#111827";
      valueEl.textContent = "";
      valueEl.appendChild(input);
      input.focus();
      input.select();
      let finished = false;
      const endEdit = (commit) => {
        if (finished) return;
        finished = true;
        if (commit) {
          const parsed = parseFloat(input.value);
          if (Number.isFinite(parsed)) {
            let next = settingsApi.clampToSliderRange(parsed, constraints);
            next = settingsApi.snapToSliderStep(next, constraints);
            next = settingsApi.clampToSliderRange(next, constraints);
            const formatted = settingsApi.formatForSlider(next, constraints);
            if (sliderEl) {
              sliderEl.value = formatted;
              sliderEl.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              options.onCommit(parseFloat(formatted));
              valueEl.textContent = formatted;
            }
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
  function updatePerspective(worldEl) {
    const renderEl = worldEl && worldEl.parentElement;
    if (!renderEl) return;
    renderEl.style.perspective = state.PERSPECTIVE + "px";
  }
  function applyBorderSettings(shapeEl) {
    if (!shapeEl) return;
    const enabled = Boolean(state.border && state.border.enabled);
    const color = state.border && state.border.color ? state.border.color : "#000000";
    const width =
      state.border && Number.isFinite(parseFloat(state.border.width))
        ? parseFloat(state.border.width)
        : 1;
    shapeEl.style.setProperty("--face-border-color", color);
    shapeEl.style.setProperty("--face-border-width", `${width}px`);
    shapeEl.classList.toggle("show-borders", enabled);
  }
  function applyLightingSettings(shapeEl) {
    if (!shapeEl) return;
    const lighting = state.lighting;
    shapeEl.classList.toggle("lighting-enabled", Boolean(lighting.enabled));
    shapeEl.style.setProperty("--lighting-color", lighting.color);
    shapeEl.style.setProperty("--lighting-intensity", String((lighting.intensity / 100) * 0.7));
    shapeEl.style.setProperty("--lighting-direction", `${90 - lighting.azimuth}deg`);
    shapeEl.style.setProperty("--lighting-softness", `${lighting.softness}%`);
  }
  function applyGridSettings(worldEl) {
    Object.entries(gridControls).forEach(([plane, control]) => {
      if (!control) return;
      control.checked = Boolean(state.grid[plane]);
      const grid = worldEl.querySelector(`.world-grid-${plane}`);
      if (grid) grid.classList.toggle("enabled", control.checked);
    });
  }
  function updateLightingDisplay() {
    Object.entries(lightingDisplays).forEach(([key, display]) => {
      if (display) display.textContent = String(state.lighting[key]);
    });
  }
  function updateShapeDimensions(shapeEl) {
    if (!shapeEl || !sliders.width) return;
    const width = parseFloat(sliders.width.value);
    const height = parseFloat(sliders.height.value);
    const depth = parseFloat(sliders.depth.value);
    const worldEl = shapeEl.parentElement;
    if (worldEl) {
      worldEl.style.width = width + "px";
      worldEl.style.height = height + "px";
    }
    if (window.shapeViewer) window.shapeViewer.updateDimensions(width, height, depth);
  }
  async function init(worldEl, shapeEl) {
    const defaults = await settingsApi.ensureDefaultsLoaded();
    settingsApi.applyDefaultsToState(state, defaults);
    settingsApi.applyDefaultsToSliders(sliders, defaults);
    Object.entries(lightingControls).forEach(([key, control]) => {
      if (!control) return;
      if (key === "enabled") {
        control.checked = state.lighting.enabled;
      } else if (key === "color") {
        control.value = state.lighting.color;
      } else {
        control.value = defaults.lighting[key];
      }
    });
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
      if (stored.lighting && typeof stored.lighting === "object") {
        const savedLighting = stored.lighting;
        if (Object.prototype.hasOwnProperty.call(savedLighting, "enabled")) {
          state.lighting.enabled = savedLighting.enabled === true || savedLighting.enabled === "true";
        }
        if (typeof savedLighting.color === "string" && /^#[0-9a-f]{6}$/i.test(savedLighting.color)) {
          state.lighting.color = savedLighting.color;
        }
        Object.entries(lightingControls).forEach(([key, control]) => {
          if (!control || key === "enabled" || key === "color") return;
          const value = parseFloat(savedLighting[key]);
          if (!Number.isFinite(value)) return;
          let next = settingsApi.clampToSliderRange(value, control);
          next = settingsApi.snapToSliderStep(next, control);
          next = settingsApi.clampToSliderRange(next, control);
          control.value = settingsApi.formatForSlider(next, control);
          state.lighting[key] = parseFloat(control.value);
        });
      }
      if (stored.grid && typeof stored.grid === "object") {
        Object.keys(gridControls).forEach((plane) => {
          const value = stored.grid[plane];
          if (typeof value === "boolean") state.grid[plane] = value;
          else if (value === "true" || value === "false") state.grid[plane] = value === "true";
        });
      }
      ["rx", "ry", "mx", "my", "mz"].forEach((key) => {
        const value = parseFloat(stored[key]);
        if (Number.isFinite(value)) state.target[key] = value;
      });
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
        lighting: { ...state.lighting },
        grid: { ...state.grid },
        rx: target.rx,
        ry: target.ry,
        mx: target.mx,
        my: target.my,
        mz: target.mz,
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
      saveSettings: persistSettings,
      resetCamera: () => {
        target.rx = parseFloat(defaults.rx);
        target.ry = parseFloat(defaults.ry);
        target.mx = parseFloat(defaults.mx);
        target.my = parseFloat(defaults.my);
        target.mz = parseFloat(defaults.mz);
        window.sliders.syncZoomSlider(parseFloat(defaults.zoom));
        persistSettings();
      },
      toggleBorders: () => {
        state.border.enabled = !state.border.enabled;
        if (borderToggle) borderToggle.checked = state.border.enabled;
        applyBorderSettings(shapeEl);
        persistSettings();
      },
      toggleLighting: () => {
        state.lighting.enabled = !state.lighting.enabled;
        if (lightingControls.enabled) lightingControls.enabled.checked = state.lighting.enabled;
        applyLightingSettings(shapeEl);
        persistSettings();
      },
      updateShapeDimensions: () => updateShapeDimensions(shapeEl),
      updatePerspective: () => updatePerspective(worldEl),
      updateZoomDisplay: (z) => {
        if (valueDisplays.zoom) {
          try {
            valueDisplays.zoom.textContent = parseFloat(z).toFixed(2);
          } catch (e) {
            valueDisplays.zoom.textContent = z;
          }
        }
      },
      syncZoomSlider: (z, persist = true) => {
        let next = settingsApi.clampToSliderRange(z, sliders.zoom);
        next = settingsApi.snapToSliderStep(next, sliders.zoom);
        next = settingsApi.clampToSliderRange(next, sliders.zoom);
        sliders.zoom.value = settingsApi.formatForSlider(next, sliders.zoom);
        target.z = parseFloat(sliders.zoom.value);
        if (valueDisplays.zoom) valueDisplays.zoom.textContent = sliders.zoom.value;
        if (persist) persistSettings();
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
    applyGridSettings(worldEl);
    if (borderColor) borderColor.value = state.border.color;
    if (borderWidthValue) borderWidthValue.textContent = state.border.width;
    if (lightingControls.enabled) lightingControls.enabled.checked = Boolean(state.lighting.enabled);
    if (lightingControls.color) lightingControls.color.value = state.lighting.color;
    Object.entries(lightingControls).forEach(([key, control]) => {
      if (!control || key === "enabled" || key === "color") return;
      control.value = String(state.lighting[key]);
    });
    updateLightingDisplay();
    sliders.width.addEventListener("input", (e) => {
      if (valueDisplays.width) valueDisplays.width.textContent = e.target.value;
      updateShapeDimensions(shapeEl);
      persistSettings();
    });
    sliders.height.addEventListener("input", (e) => {
      if (valueDisplays.height) valueDisplays.height.textContent = e.target.value;
      updateShapeDimensions(shapeEl);
      persistSettings();
    });
    sliders.depth.addEventListener("input", (e) => {
      if (valueDisplays.depth) valueDisplays.depth.textContent = e.target.value;
      updateShapeDimensions(shapeEl);
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
      updatePerspective(worldEl);
      persistSettings();
    });
    if (borderToggle) {
      borderToggle.addEventListener("input", (e) => {
        state.border.enabled = e.target.checked;
        applyBorderSettings(shapeEl);
        persistSettings();
      });
    }
    Object.entries(gridControls).forEach(([plane, control]) => {
      if (!control) return;
      control.addEventListener("input", (e) => {
        state.grid[plane] = e.target.checked;
        applyGridSettings(worldEl);
        persistSettings();
      });
    });
    if (borderColor) {
      borderColor.addEventListener("input", (e) => {
        state.border.color = e.target.value;
        applyBorderSettings(shapeEl);
        persistSettings();
      });
    }
    Object.entries(lightingControls).forEach(([key, control]) => {
      if (!control) return;
      control.addEventListener("input", (e) => {
        if (key === "enabled") {
          state.lighting.enabled = e.target.checked;
        } else if (key === "color") {
          state.lighting.color = e.target.value;
        } else {
          state.lighting[key] = parseFloat(e.target.value);
          if (lightingDisplays[key]) lightingDisplays[key].textContent = e.target.value;
        }
        applyLightingSettings(shapeEl);
        persistSettings();
      });
    });
    enableInlineValueEdit(sliders.width, valueDisplays.width);
    enableInlineValueEdit(sliders.height, valueDisplays.height);
    enableInlineValueEdit(sliders.depth, valueDisplays.depth);
    enableInlineValueEdit(sliders.smoothness, valueDisplays.smoothness);
    enableInlineValueEdit(sliders.zoom, valueDisplays.zoom);
    enableInlineValueEdit(sliders.scale, valueDisplays.scale);
    enableInlineValueEdit(sliders.sensitivity, valueDisplays.sensitivity);
    enableInlineValueEdit(sliders.perspective, valueDisplays.perspective);
    enableInlineValueEdit(null, borderWidthValue, {
      min: "0",
      step: "0.1",
      onCommit: (width) => {
        state.border.width = width;
        applyBorderSettings(shapeEl);
        persistSettings();
      },
    });

    updateShapeDimensions(shapeEl);
    updatePerspective(worldEl);
    applyBorderSettings(shapeEl);
    applyLightingSettings(shapeEl);
  }
  window.initSliders = init;
})();
