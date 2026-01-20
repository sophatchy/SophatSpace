# SophatSpace (Static)

This is a static HTML project. It is split into HTML, CSS, JS, and data for easier maintenance.

## Structure
- `index.html` - main entry
- `styles/main.css` - custom styles
- `scripts/app.js` - app logic
- `scripts/data/sections.json` - checklist content

## Local preview
Because `scripts/data/sections.json` is loaded via `fetch`, run a local server instead of opening the file directly.

Example using Python:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Optional tooling (Vite)
If you want a fast dev server and a static build output:

```sh
npm install
npm run dev
```

Build to `dist/`:

```sh
npm run build
```
