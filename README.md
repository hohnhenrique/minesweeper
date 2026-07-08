# Minesweeper - risk detector

https://hohnhenrique.github.io/minesweeper

Implementation of the classic Minesweeper in **vanilla JavaScript**, with no frameworks or external dependencies. Visual theme inspired by retro detection terminals.

🎮 [Play online](#) — *replace with the GitHub Pages link after deploy*

## Features

- Three difficulty levels: easy (9×9, 10 mines), medium (12×12, 24 mines) and hard (16×12, 40 mines)
- First click always safe (mines are only placed after the first move)
- Cascading reveal (flood fill) for areas with no adjacent mines
- Flag marking with the right mouse button
- Timer and remaining mines counter
- Fully keyboard navigable (Tab to move between cells, Enter/Space to reveal, F to flag)
- Responsive, with `prefers-reduced-motion` support

## Technologies

- HTML5
- CSS3 (CSS variables, grid layout)
- JavaScript (ES6+, no libraries)

## How to run locally

There is no build step. Just open the `index.html` file in the browser, or run a simple local server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then access `http://localhost:8000`.

## Project structure

```
minesweeper/
├── index.html      # page structure
├── style.css        # styles and visual theme
├── script.js         # game logic
└── README.md
```

## Game logic

The core logic is in `script.js` and covers:

- **Board generation**: matrix of cells with state (`mine`, `revealed`, `flagged`, `adjacent`)
- **Mine placement**: random, but excluding the clicked cell and its immediate neighbors, ensuring the first click is never a loss
- **Adjacent mine count**: for each safe cell, counts how many of the 8 neighbors contain mines
- **Flood fill**: recursive reveal of connected empty cells
- **Win condition**: all non-mined cells revealed

## Possible future improvements

- Save high scores (currently the state doesn't persist between sessions)
- Customizable difficulty mode (board size and mine count defined by the user)
- Cell-by-cell reveal animations
- Double-tap support on mobile devices to flag cells

## License

Free to use and modify.
# minesweeper