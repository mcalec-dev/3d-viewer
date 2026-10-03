# 3d-viewer

A lightweight browser-based 3D viewer built with plain HTML, CSS, and JavaScript. It renders polygonal faces as CSS-transformed elements, with adjustable dimensions, camera settings, world grids, border styling, and lighting effects.

## Features

- Interactive 3D rotation, panning, and zooming
- Shape chooser with JSON-defined models
- Texture selection with CSS-based material styling
- Camera and world controls for size, perspective, sensitivity, and smoothing
- Adjustable face borders and lighting approximation
- Static-host friendly shape and texture manifests

## Controls

- Left mouse drag: rotate the model
- Right mouse drag: pan the view
- Mouse wheel: zoom in and out
- Controls are available in the left-side settings panel for dimensions, camera, lighting, and grid visibility

> Lighting is a CSS shading approximation. It does not simulate physically based light transport or cast shadows.

## Run locally

Because this project is static, you can serve it from any simple HTTP server.

From the project root:

```bash
npx http-server -p 8080 -c-1
```

Then open:

```text
http://localhost:8080
```

Alternative:

```bash
python -m http.server 8080
```

## Project structure

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── chooser.js
│   ├── info.js
│   ├── renderer.js
│   ├── settings.js
│   ├── shapes.js
│   ├── sliders.js
│   └── state.js
├── json/
│   ├── settings.json
│   ├── shape.schema.json
│   ├── shapes.json
│   ├── texture.schema.json
│   └── textures.json
├── shapes/
│   ├── cube.json
│   └── pyramid.json
├── textures/
│   ├── colors/
│   ├── grid/
│   ├── marble/
│   ├── noise/
│   └── wood/
├── package.json
├── LICENSE.md
└── README.md
```

## Shape format

Shape definitions live in `shapes/` as JSON files. When a server exposes directory listings, the app auto-discovers files in the folder. If directory listing is unavailable, each filename must be listed in `json/shapes.json`.

Each shape follows the schema in `json/shape.schema.json` and contains:

- a `name`
- a `faces` array
- each face includes:
  - `id`: a valid face identifier
  - `vertices`: at least 3 normalized 3D points in the range `-0.5` to `0.5`
  - optional `color`
  - optional `image`

Example face:

```json
{
  "id": "front",
  "vertices": [
    [0.0, 0.0, 0.5],
    [0.5, 0.0, 0.5],
    [0.0, 0.5, 0.5]
  ],
  "color": "#ffffff"
}
```

## Texture format

Texture packages live under `textures/` and each folder contains a `style.css` file. The stylesheet may reference assets in the same folder.

Add the texture folder name to `json/textures.json` to load it. The manifest is validated against `json/texture.schema.json`.

## Notes

This project is inspired by the concept of representing a 3D object as a state-space of faces and transforms in the browser.

Live demo: [3d.mcalec.dev](https://3d.mcalec.dev)
