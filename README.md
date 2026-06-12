# Theatre Proj

A project setup with Tailwind CSS, HTML, CSS, and JavaScript.

## Project Structure

```
Theatre Proj/
├── src/
│   ├── css/
│   │   ├── input.css      # Tailwind CSS input file
│   │   └── output.css     # Generated Tailwind CSS (auto-generated)
│   ├── js/
│   │   └── main.js        # Main JavaScript file
│   └── html/
│       └── index.html     # Main HTML file
├── package.json
├── tailwind.config.js
└── README.md
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build CSS (development mode with watch):
   ```bash
   npm run build-css
   ```

3. Build CSS (production mode, minified):
   ```bash
   npm run build-css-prod
   ```

## Usage

- Edit `src/css/input.css` to add custom Tailwind directives or custom CSS
- Edit `src/html/index.html` for your HTML structure
- Edit `src/js/main.js` for your JavaScript code
- The `output.css` file is auto-generated - do not edit it directly

## Tailwind CSS

This project uses Tailwind CSS v3.4.1. All Tailwind classes are available in your HTML files.
