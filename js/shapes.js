(() => {
  const SHAPES_PATH = "shapes/";
  const SHAPES_MANIFEST_PATH = "json/shapes.json";
  const SHAPE_STORAGE_KEY = "selected-shape";
  const shapeSelect = document.getElementById("shapeChooser");
  const shapeElement = document.querySelector(".shape");
  let activeShape = null;
  let dimensions = { width: 100, height: 100, depth: 100 };

  function assertShape(shape, source) {
    if (!shape || typeof shape !== "object" || typeof shape.name !== "string" || !shape.name.trim()) {
      throw new Error(`Invalid shape name in ${source}`);
    }
    if (!Array.isArray(shape.faces) || shape.faces.length === 0) {
      throw new Error(`Shape ${shape.name} must define at least one face`);
    }
    shape.faces.forEach((face, index) => {
      if (!face || !/^[a-zA-Z][\w-]*$/.test(face.id || "")) {
        throw new Error(`Invalid face id at index ${index} in ${source}`);
      }
      if (!Array.isArray(face.vertices) || face.vertices.length < 3 || face.vertices.some((vertex) =>
        !Array.isArray(vertex) || vertex.length !== 3 || vertex.some((coordinate) =>
          !Number.isFinite(coordinate) || coordinate < -0.5 || coordinate > 0.5
        )
      )) {
        throw new Error(`Face ${face.id} must have 3D vertices between -0.5 and 0.5 in ${source}`);
      }
    });
    return shape;
  }

  function subtract(first, second) {
    return first.map((value, index) => value - second[index]);
  }

  function cross(first, second) {
    return [
      first[1] * second[2] - first[2] * second[1],
      first[2] * second[0] - first[0] * second[2],
      first[0] * second[1] - first[1] * second[0],
    ];
  }

  function dot(first, second) {
    return first.reduce((sum, value, index) => sum + value * second[index], 0);
  }

  function normalize(vector) {
    const length = Math.hypot(...vector);
    if (length < 1e-8) throw new Error("Shape contains a degenerate face");
    return vector.map((value) => value / length);
  }

  function createFace(faceData, shapeData) {
    const vertices = faceData.vertices.map(([x, y, z]) => [
      x * dimensions.width,
      -y * dimensions.height,
      z * dimensions.depth,
    ]);
    const normal = normalize(cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]))).map((value) => -value);
    const axisX = normalize(subtract(vertices[1], vertices[0]));
    const axisY = normalize(cross(axisX, normal));
    const projected = vertices.map((vertex) => [dot(vertex, axisX), dot(vertex, axisY)]);
    const minX = Math.min(...projected.map(([x]) => x));
    const maxX = Math.max(...projected.map(([x]) => x));
    const minY = Math.min(...projected.map(([, y]) => y));
    const maxY = Math.max(...projected.map(([, y]) => y));
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const centerNormal = vertices.reduce((sum, vertex) => sum + dot(vertex, normal), 0) / vertices.length;
    const center = [0, 1, 2].map((axis) =>
      axisX[axis] * (minX + maxX) / 2 +
      axisY[axis] * (minY + maxY) / 2 +
      normal[axis] * centerNormal
    );
    const origin = center.map((value, axis) =>
      value - axisX[axis] * faceWidth / 2 + axisY[axis] * faceHeight / 2
    );
    const face = document.createElement("div");
    face.className = `face ${faceData.id}`;
    face.dataset.normal = normal.join(",");
    face.style.width = `${faceWidth}px`;
    face.style.height = `${faceHeight}px`;
    face.style.transformOrigin = "0 0";
    face.style.transform = `matrix3d(${[
      ...axisX, 0,
      ...axisY.map((value) => -value), 0,
      ...normal, 0,
      ...origin, 1,
    ].join(",")})`;
    face.style.clipPath = `polygon(${projected.map(([x, y]) =>
      `${((x - minX) / faceWidth) * 100}% ${((maxY - y) / faceHeight) * 100}%`
    ).join(",")})`;
    if (faceData.color) face.style.backgroundColor = faceData.color;
    if (faceData.image) {
      face.style.backgroundImage = `url("${new URL(faceData.image, shapeData.source).href}")`;
      face.style.backgroundSize = "cover";
      face.style.backgroundPosition = "center";
    }
    return face;
  }

  function renderShape(shapeData) {
    const content = document.createDocumentFragment();
    shapeData.faces.forEach((face) => content.appendChild(createFace(face, shapeData)));
    shapeElement.replaceChildren(content);
    shapeElement.dataset.shape = shapeData.id;
    activeShape = shapeData;
  }

  function updateDimensions(width, height, depth) {
    dimensions = { width, height, depth };
    if (activeShape) renderShape(activeShape);
  }

  async function fetchShape(fileName) {
    if (typeof fileName !== "string" || !/^[\w-]+\.json$/i.test(fileName)) return null;
    const source = new URL(fileName, new URL(SHAPES_PATH, document.baseURI));
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${source.pathname}: ${response.status}`);
    const definition = assertShape(await response.json(), source.pathname);
    return { ...definition, id: fileName, source: source.href };
  }

  async function discoverShapeFiles() {
    try {
      const response = await fetch(SHAPES_PATH, { cache: "no-store" });
      if (response.ok) {
        const directory = new DOMParser().parseFromString(await response.text(), "text/html");
        const directoryUrl = new URL(SHAPES_PATH, document.baseURI);
        const files = Array.from(directory.querySelectorAll("a[href]"), (anchor) => {
          const url = new URL(anchor.getAttribute("href"), directoryUrl);
          const name = decodeURIComponent(url.pathname.slice(directoryUrl.pathname.length));
          return url.origin === directoryUrl.origin && /^[\w-]+\.json$/i.test(name) ? name : null;
        }).filter(Boolean);
        if (files.length) return files;
      }
    } catch (error) {
      console.info("Shape folder listing unavailable; using json/shapes.json", error);
    }
    const response = await fetch(SHAPES_MANIFEST_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${SHAPES_MANIFEST_PATH}: ${response.status}`);
    const manifest = await response.json();
    if (!manifest || !Array.isArray(manifest.shapes)) throw new Error("Invalid shape registry");
    return manifest.shapes;
  }

  async function initialize(element = shapeElement) {
    if (element !== shapeElement || !shapeSelect) throw new Error("Shape viewer elements are missing");
    const files = await discoverShapeFiles();
    const loaded = (await Promise.all(files.map(async (fileName) => {
      try {
        return await fetchShape(fileName);
      } catch (error) {
        console.warn(`Skipping shape ${fileName}:`, error);
        return null;
      }
    }))).filter(Boolean);
    if (!loaded.length) throw new Error("No valid shape JSON files were found in shapes/");

    const stored = localStorage.getItem(SHAPE_STORAGE_KEY);
    shapeSelect.replaceChildren(...loaded.map((shape) => {
      const option = document.createElement("option");
      option.value = shape.id;
      option.textContent = shape.name;
      return option;
    }));
    const selectShape = (id) => {
      const selected = loaded.find((shape) => shape.id === id) || loaded[0];
      shapeSelect.value = selected.id;
      renderShape(selected);
      localStorage.setItem(SHAPE_STORAGE_KEY, selected.id);
    };
    selectShape(loaded.some((shape) => shape.id === stored) ? stored : loaded[0].id);
    shapeSelect.addEventListener("change", () => selectShape(shapeSelect.value));
  }

  window.shapeViewer = { initialize, updateDimensions };
})();
