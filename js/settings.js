(() => {
	const SETTINGS_STORAGE_KEY = "slider-settings";
	const DEFAULTS_PATH = "json/settings.json";
	let defaultsCache = null;
	let defaultsPromise = null;
	function assertNumber(value, key) {
		const parsed = parseFloat(value);
		if (!Number.isFinite(parsed)) {
			throw new Error(`Invalid or missing default for ${key} in ${DEFAULTS_PATH}`);
		}
		return parsed;
	}
	function assertBoolean(value, key) {
		if (typeof value === "boolean") return value;
		if (typeof value === "string") {
			const normalized = value.trim().toLowerCase();
			if (normalized === "true") return true;
			if (normalized === "false") return false;
		}
		throw new Error(`Invalid or missing default for ${key} in ${DEFAULTS_PATH}`);
	}
	function assertString(value, key) {
		if (typeof value === "string" && value.trim() !== "") return value;
		throw new Error(`Invalid or missing default for ${key} in ${DEFAULTS_PATH}`);
	}
	function assertPositiveNumber(value, key) {
		const parsed = parseFloat(value);
		if (!Number.isFinite(parsed) || parsed < 0) {
			throw new Error(`Invalid or missing default for ${key} in ${DEFAULTS_PATH}`);
		}
		return parsed;
	}
	function normalizeDefaults(raw) {
		if (!raw || typeof raw !== "object") {
			throw new Error(`Invalid defaults JSON in ${DEFAULTS_PATH}`);
		}
		if (!raw.border || typeof raw.border !== "object") {
			throw new Error(`Invalid or missing default for border in ${DEFAULTS_PATH}`);
		}
		return {
			width: String(assertNumber(raw.width, "width")),
			height: String(assertNumber(raw.height, "height")),
			depth: String(assertNumber(raw.depth, "depth")),
			smoothness: String(assertNumber(raw.smoothness, "smoothness")),
			zoom: String(assertNumber(raw.zoom, "zoom")),
			scale: String(assertNumber(raw.scale, "scale")),
			sensitivity: String(assertNumber(raw.sensitivity, "sensitivity")),
			perspective: String(assertNumber(raw.perspective, "perspective")),
			rx: String(assertNumber(raw.rx, "rx")),
			ry: String(assertNumber(raw.ry, "ry")),
			border: {
				enabled: assertBoolean(raw.border.enabled, "border.enabled"),
				color: assertString(raw.border.color, "border.color"),
				width: assertPositiveNumber(raw.border.width, "border.width"),
			},
		};
	}
	function ensureDefaultsLoaded() {
		if (defaultsCache) return Promise.resolve(defaultsCache);
		if (!defaultsPromise) {
			defaultsPromise = fetch(DEFAULTS_PATH, { cache: "no-store" })
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Failed to load ${DEFAULTS_PATH}: ${response.status}`);
					}
					return response.json();
				})
				.then((json) => {
					defaultsCache = normalizeDefaults(json);
					return defaultsCache;
				});
		}
		return defaultsPromise;
	}
	function applyDefaultsToSliders(sliders, defaults) {
		Object.entries(sliders).forEach(([key, sliderEl]) => {
			if (!sliderEl || !(key in defaults)) return;
			const candidate = parseFloat(defaults[key]);
			let next = clampToSliderRange(candidate, sliderEl);
			next = snapToSliderStep(next, sliderEl);
			next = clampToSliderRange(next, sliderEl);
			sliderEl.value = formatForSlider(next, sliderEl);
		});
	}
	function applyDefaultsToState(state, defaults) {
		state.SMOOTHING = parseFloat(defaults.smoothness);
		state.SENSITIVITY = parseFloat(defaults.sensitivity);
		state.PERSPECTIVE = parseFloat(defaults.perspective);
		state.target.rx = parseFloat(defaults.rx);
		state.target.ry = parseFloat(defaults.ry);
		state.target.s = parseFloat(defaults.scale);
		state.target.z = parseFloat(defaults.zoom);
		state.border.enabled = defaults.border.enabled;
		state.border.color = defaults.border.color;
		state.border.width = defaults.border.width;
	}
	function parseStepDecimals(stepValue) {
		const stepText = String(stepValue || "1");
		if (stepText.toLowerCase() === "any") return 6;
		const decimalPart = stepText.split(".")[1];
		return decimalPart ? decimalPart.length : 0;
	}
	function clampToSliderRange(value, sliderEl) {
		const min = parseFloat(sliderEl.min);
		const max = parseFloat(sliderEl.max);
		const hasMin = Number.isFinite(min);
		const hasMax = Number.isFinite(max);
		let next = value;
		if (hasMin) next = Math.max(min, next);
		if (hasMax) next = Math.min(max, next);
		return next;
	}
	function snapToSliderStep(value, sliderEl) {
		const stepText = String(sliderEl.step || "1");
		if (stepText.toLowerCase() === "any") return value;
		const step = parseFloat(stepText);
		if (!Number.isFinite(step) || step <= 0) return value;
		const min = parseFloat(sliderEl.min);
		const base = Number.isFinite(min) ? min : 0;
		return base + Math.round((value - base) / step) * step;
	}
	function formatForSlider(value, sliderEl) {
		const decimals = parseStepDecimals(sliderEl.step);
		return Number(value).toFixed(decimals);
	}
	function saveSliderSettings(sliders, extraSettings = {}) {
		try {
			const settings = {};
			Object.entries(sliders).forEach(([key, sliderEl]) => {
				if (sliderEl) settings[key] = sliderEl.value;
			});
			Object.assign(settings, extraSettings);
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
		} catch (err) {
			console.warn("Unable to save slider settings:", err);
		}
	}
	function restoreSliderSettings(sliders, applyExtraSettings) {
		try {
			const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object") return;
			if (typeof applyExtraSettings === "function") {
				applyExtraSettings(parsed);
			}
			Object.entries(sliders).forEach(([key, sliderEl]) => {
				if (!sliderEl || !(key in parsed)) return;
				const candidate = parseFloat(parsed[key]);
				if (!Number.isFinite(candidate)) return;
				let next = clampToSliderRange(candidate, sliderEl);
				next = snapToSliderStep(next, sliderEl);
				next = clampToSliderRange(next, sliderEl);
				sliderEl.value = formatForSlider(next, sliderEl);
			});
		} catch (err) {
			console.warn("Unable to restore slider settings:", err);
		}
	}
	function syncRuntimeFromSliders(sliders, state) {
		if (sliders.smoothness) state.SMOOTHING = parseFloat(sliders.smoothness.value);
		if (sliders.sensitivity) state.SENSITIVITY = parseFloat(sliders.sensitivity.value);
		if (sliders.perspective) state.PERSPECTIVE = parseFloat(sliders.perspective.value);
		if (sliders.scale) state.target.s = parseFloat(sliders.scale.value);
		if (sliders.zoom) state.target.z = parseFloat(sliders.zoom.value);
	}
	window.viewerSettings = {
		ensureDefaultsLoaded,
		applyDefaultsToSliders,
		applyDefaultsToState,
		parseStepDecimals,
		clampToSliderRange,
		snapToSliderStep,
		formatForSlider,
		saveSliderSettings,
		restoreSliderSettings,
		syncRuntimeFromSliders,
	};
})();
