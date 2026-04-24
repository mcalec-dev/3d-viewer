(() => {
	const TEXTURES_PATH = "json/textures.json";
	const TEXTURE_LINK_ID = "activeTextureStylesheet";
	const TEXTURE_STORAGE_KEY = "selected-texture";
	function setTextureStylesheet(cssPath) {
		if (!cssPath) return Promise.reject(new Error("Missing CSS path"));
		let linkEl = document.getElementById(TEXTURE_LINK_ID);
		if (!linkEl) {
			linkEl = document.createElement("link");
			linkEl.id = TEXTURE_LINK_ID;
			linkEl.rel = "stylesheet";
			document.head.appendChild(linkEl);
		}
		return new Promise((resolve, reject) => {
			const onLoad = () => {
				cleanup();
				resolve();
			};
			const onError = () => {
				cleanup();
				reject(new Error(`Failed to load texture stylesheet: ${cssPath}`));
			};
			const cleanup = () => {
				linkEl.removeEventListener("load", onLoad);
				linkEl.removeEventListener("error", onError);
			};

			linkEl.addEventListener("load", onLoad);
			linkEl.addEventListener("error", onError);
			linkEl.href = cssPath;
		});
	}
	function renderOptions(selectEl, textures) {
		selectEl.innerHTML = "";
		textures.forEach((texture) => {
			const option = document.createElement("option");
			option.value = texture.name;
			option.textContent = texture.name;
			selectEl.appendChild(option);
		});
	}
	document.addEventListener("DOMContentLoaded", async () => {
		const selectEl = document.getElementById("textureSelect");
		if (!selectEl) return;
		try {
			const response = await fetch(TEXTURES_PATH, { cache: "no-store" });
			if (!response.ok) {
				throw new Error(`Failed to load ${TEXTURES_PATH}: ${response.status}`);
			}
			const textures = await response.json();
			if (!Array.isArray(textures) || textures.length === 0) {
				throw new Error("No textures defined in textures.json");
			}
			const validTextures = textures.filter(
				(item) => item && typeof item.name === "string" && typeof item.css === "string"
			);
			if (validTextures.length === 0) {
				throw new Error("No valid texture entries found");
			}
			renderOptions(selectEl, validTextures);
			const byName = new Map(validTextures.map((texture) => [texture.name, texture]));
			const stored = localStorage.getItem(TEXTURE_STORAGE_KEY);

			const preferredNames = [];
			if (stored && byName.has(stored)) preferredNames.push(stored);
			["grid", "colors"].forEach((name) => {
				if (byName.has(name) && !preferredNames.includes(name)) preferredNames.push(name);
			});
			validTextures.forEach((texture) => {
				if (!preferredNames.includes(texture.name)) preferredNames.push(texture.name);
			});

			let activeName = null;
			for (const name of preferredNames) {
				const texture = byName.get(name);
				if (!texture) continue;
				try {
					await setTextureStylesheet(texture.css);
					activeName = name;
					break;
				} catch (err) {
					console.warn(err.message);
				}
			}

			if (!activeName) {
				throw new Error("No loadable texture stylesheets were found");
			}

			selectEl.value = activeName;
			localStorage.setItem(TEXTURE_STORAGE_KEY, activeName);

			selectEl.addEventListener("change", async () => {
				const previous = activeName;
				const chosen = byName.get(selectEl.value);
				if (!chosen) return;
				try {
					await setTextureStylesheet(chosen.css);
					activeName = chosen.name;
					localStorage.setItem(TEXTURE_STORAGE_KEY, chosen.name);
				} catch (err) {
					console.error(err.message);
					selectEl.value = previous;
				}
			});
		} catch (err) {
			console.error("Failed to initialize textures:", err);
			selectEl.innerHTML = "";
			const option = document.createElement("option");
			option.value = "";
			option.textContent = "Texture load failed";
			selectEl.appendChild(option);
			selectEl.disabled = true;
		}
	});
})();
