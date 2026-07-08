/**
 * Campo Minado — lógica do jogo em JavaScript puro.
 * Sem dependências externas. Estado da partida mantido em memória;
 * estatísticas de partidas anteriores são persistidas no
 * localStorage do navegador.
 */

(() => {
  "use strict";

  // ---------- configurações de dificuldade ----------

  const LEVELS = {
    easy: { rows: 9, cols: 9, mines: 10, label: "fácil" },
    medium: { rows: 12, cols: 12, mines: 24, label: "médio" },
    hard: { rows: 16, cols: 12, mines: 40, label: "difícil" },
  };

  const STATS_STORAGE_KEY = "campo-minado:stats:v1";

  // ---------- elementos do DOM ----------

  const boardEl = document.getElementById("board");
  const mineCountEl = document.getElementById("mine-count");
  const timerEl = document.getElementById("timer");
  const faceIconEl = document.getElementById("face-icon");
  const resetBtn = document.getElementById("reset-btn");
  const statusLineEl = document.getElementById("status-line");
  const difficultyBtns = document.querySelectorAll(".difficulty__btn");
  const overlayEl = document.getElementById("overlay");
  const overlayMessageEl = document.getElementById("overlay-message");
  const overlayDetailEl = document.getElementById("overlay-detail");
  const overlayBtn = document.getElementById("overlay-btn");

  const manualBtn = document.getElementById("manual-btn");
  const manualModal = document.getElementById("manual-modal");
  const manualClose = document.getElementById("manual-close");

  const statsBtn = document.getElementById("stats-btn");
  const statsModal = document.getElementById("stats-modal");
  const statsClose = document.getElementById("stats-close");
  const statsBody = document.getElementById("stats-body");

  // ---------- estado do jogo ----------

  let level = "easy";
  let grid = []; // matriz de células { mine, revealed, flagged, adjacent }
  let rows, cols, totalMines;
  let flagsUsed = 0;
  let cellsRevealed = 0;
  let gameOver = false;
  let gameWon = false;
  let firstClickDone = false;
  let timerInterval = null;
  let secondsElapsed = 0;

  // ---------- estatísticas (persistidas no localStorage) ----------

  function defaultStats() {
    const perLevel = {};
    Object.keys(LEVELS).forEach((key) => {
      perLevel[key] = { played: 0, wins: 0, losses: 0, bestTime: null };
    });
    return {
      totalPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      currentStreak: 0,
      bestStreak: 0,
      levels: perLevel,
    };
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return defaultStats();
      const parsed = JSON.parse(raw);
      // mescla com o padrão para tolerar versões antigas/incompletas
      const base = defaultStats();
      return {
        ...base,
        ...parsed,
        levels: { ...base.levels, ...(parsed.levels || {}) },
      };
    } catch (err) {
      console.warn("não foi possível ler as estatísticas salvas:", err);
      return defaultStats();
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (err) {
      console.warn("não foi possível salvar as estatísticas:", err);
    }
  }

  function recordGameResult(won) {
    const stats = loadStats();
    const lvl = stats.levels[level];

    stats.totalPlayed++;
    lvl.played++;

    if (won) {
      stats.totalWins++;
      lvl.wins++;
      stats.currentStreak++;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      if (lvl.bestTime === null || secondsElapsed < lvl.bestTime) {
        lvl.bestTime = secondsElapsed;
      }
    } else {
      stats.totalLosses++;
      lvl.losses++;
      stats.currentStreak = 0;
    }

    saveStats(stats);
  }

  function formatPercent(part, total) {
    if (!total) return "0%";
    return `${Math.round((part / total) * 100)}%`;
  }

  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return "—";
    return `${String(seconds).padStart(3, "0")}s`;
  }

  function renderStats() {
    const stats = loadStats();

    if (stats.totalPlayed === 0) {
      statsBody.innerHTML = `
        <p class="stats-empty">nenhuma partida registrada ainda — jogue uma rodada para começar a gerar estatísticas.</p>
      `;
      return;
    }

    const rows = Object.keys(LEVELS)
      .map((key) => {
        const lvl = stats.levels[key];
        const meta = LEVELS[key];
        return `
          <tr>
            <td>${meta.label}</td>
            <td>${lvl.played}</td>
            <td>${lvl.wins}</td>
            <td>${formatPercent(lvl.wins, lvl.played)}</td>
            <td>${formatTime(lvl.bestTime)}</td>
          </tr>
        `;
      })
      .join("");

    statsBody.innerHTML = `
      <div class="stats-summary">
        <div class="stats-summary__item">
          <span class="stats-summary__value">${stats.totalPlayed}</span>
          <span class="stats-summary__label">partidas</span>
        </div>
        <div class="stats-summary__item">
          <span class="stats-summary__value">${formatPercent(stats.totalWins, stats.totalPlayed)}</span>
          <span class="stats-summary__label">taxa de vitória</span>
        </div>
        <div class="stats-summary__item">
          <span class="stats-summary__value">${stats.totalWins}</span>
          <span class="stats-summary__label">vitórias</span>
        </div>
        <div class="stats-summary__item">
          <span class="stats-summary__value">${stats.totalLosses}</span>
          <span class="stats-summary__label">derrotas</span>
        </div>
        <div class="stats-summary__item">
          <span class="stats-summary__value">${stats.currentStreak}</span>
          <span class="stats-summary__label">sequência atual</span>
        </div>
        <div class="stats-summary__item">
          <span class="stats-summary__value">${stats.bestStreak}</span>
          <span class="stats-summary__label">melhor sequência</span>
        </div>
      </div>

      <table class="stats-table">
        <caption>por dificuldade</caption>
        <thead>
          <tr>
            <th>nível</th>
            <th>jogos</th>
            <th>vitórias</th>
            <th>%</th>
            <th>melhor tempo</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <button class="stats-reset-btn" id="stats-reset-btn" type="button">zerar estatísticas</button>
    `;

    document.getElementById("stats-reset-btn").addEventListener("click", () => {
      if (confirm("tem certeza que deseja apagar todas as estatísticas salvas?")) {
        saveStats(defaultStats());
        renderStats();
      }
    });
  }

  // ---------- modais ----------

  function openModal(modalEl) {
    modalEl.classList.add("is-visible");
    modalEl.setAttribute("aria-hidden", "false");
  }

  function closeModal(modalEl) {
    modalEl.classList.remove("is-visible");
    modalEl.setAttribute("aria-hidden", "true");
  }

  manualBtn.addEventListener("click", () => openModal(manualModal));
  manualClose.addEventListener("click", () => closeModal(manualModal));
  manualModal.addEventListener("click", (e) => {
    if (e.target === manualModal) closeModal(manualModal);
  });

  statsBtn.addEventListener("click", () => {
    renderStats();
    openModal(statsModal);
  });
  statsClose.addEventListener("click", () => closeModal(statsModal));
  statsModal.addEventListener("click", (e) => {
    if (e.target === statsModal) closeModal(statsModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(manualModal);
      closeModal(statsModal);
    }
  });

  // ---------- inicialização ----------

  function initGame(selectedLevel = level) {
    level = selectedLevel;
    const config = LEVELS[level];
    rows = config.rows;
    cols = config.cols;
    totalMines = config.mines;

    grid = [];
    flagsUsed = 0;
    cellsRevealed = 0;
    gameOver = false;
    gameWon = false;
    firstClickDone = false;
    secondsElapsed = 0;

    stopTimer();
    timerEl.textContent = "000";
    faceIconEl.textContent = "◔";
    mineCountEl.textContent = String(totalMines).padStart(3, "0");
    statusLineEl.textContent = "clique para revelar · botão direito para marcar";
    overlayEl.classList.remove("is-visible");

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          mine: false,
          revealed: false,
          flagged: false,
          adjacent: 0,
        });
      }
      grid.push(row);
    }

    renderBoard();
  }

  // minas são posicionadas apenas após o primeiro clique, garantindo
  // que o jogador nunca perca na primeira jogada
  function placeMines(excludeRow, excludeCol) {
    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;
      if (grid[r][c].mine || isExcluded) continue;

      grid[r][c].mine = true;
      placed++;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c].adjacent = countAdjacentMines(r, c);
      }
    }
  }

  function countAdjacentMines(row, col) {
    let count = 0;
    forEachNeighbor(row, col, (r, c) => {
      if (grid[r][c].mine) count++;
    });
    return count;
  }

  function forEachNeighbor(row, col, callback) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          callback(r, c);
        }
      }
    }
  }

  // ---------- renderização ----------

  function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellEl = document.createElement("div");
        cellEl.className = "cell";
        cellEl.setAttribute("role", "gridcell");
        cellEl.setAttribute("tabindex", "0");
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;
        cellEl.setAttribute("aria-label", `célula linha ${r + 1}, coluna ${c + 1}`);

        cellEl.addEventListener("click", () => handleReveal(r, c));
        cellEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          handleFlag(r, c);
        });
        cellEl.addEventListener("keydown", (e) => handleKeyboard(e, r, c));

        boardEl.appendChild(cellEl);
      }
    }
  }

  function updateCellDisplay(row, col) {
    const cellEl = boardEl.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
    if (!cellEl) return;

    const cell = grid[row][col];

    cellEl.classList.toggle("is-revealed", cell.revealed);
    cellEl.classList.toggle("is-flagged", cell.flagged && !cell.revealed);

    if (cell.revealed && cell.mine) {
      cellEl.classList.add("is-mine");
      cellEl.textContent = "✸";
    } else if (cell.flagged && !cell.revealed) {
      cellEl.textContent = "⚑";
    } else if (cell.revealed && cell.adjacent > 0) {
      cellEl.textContent = String(cell.adjacent);
      cellEl.dataset.n = cell.adjacent;
    } else if (cell.revealed) {
      cellEl.textContent = "";
    } else {
      cellEl.textContent = "";
    }
  }

  // ---------- interação ----------

  function handleReveal(row, col) {
    if (gameOver || gameWon) return;
    const cell = grid[row][col];
    if (cell.revealed || cell.flagged) return;

    if (!firstClickDone) {
      placeMines(row, col);
      firstClickDone = true;
      startTimer();
    }

    if (cell.mine) {
      triggerGameOver(row, col);
      return;
    }

    revealCell(row, col);
    checkWinCondition();
  }

  function revealCell(row, col) {
    const cell = grid[row][col];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    cellsRevealed++;
    updateCellDisplay(row, col);

    // flood fill: se a célula não tem minas adjacentes, revela vizinhos
    if (cell.adjacent === 0) {
      forEachNeighbor(row, col, (r, c) => {
        if (!grid[r][c].revealed && !grid[r][c].flagged) {
          revealCell(r, c);
        }
      });
    }
  }

  function handleFlag(row, col) {
    if (gameOver || gameWon) return;
    const cell = grid[row][col];
    if (cell.revealed) return;

    if (!firstClickDone) {
      // permite marcar antes do primeiro clique sem iniciar o timer
    }

    cell.flagged = !cell.flagged;
    flagsUsed += cell.flagged ? 1 : -1;
    mineCountEl.textContent = String(totalMines - flagsUsed).padStart(3, "0");
    updateCellDisplay(row, col);
  }

  function handleKeyboard(e, row, col) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleReveal(row, col);
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      handleFlag(row, col);
    }
  }

  // ---------- condições de fim de jogo ----------

  function triggerGameOver(triggerRow, triggerCol) {
    gameOver = true;
    stopTimer();
    faceIconEl.textContent = "✸";
    statusLineEl.textContent = "mina detonada";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell.mine) {
          cell.revealed = true;
          updateCellDisplay(r, c);
        }
      }
    }

    const triggeredEl = boardEl.querySelector(
      `[data-row="${triggerRow}"][data-col="${triggerCol}"]`
    );
    if (triggeredEl) {
      triggeredEl.classList.add("is-mine-triggered");
    }

    recordGameResult(false);
    showOverlay(false);
  }

  function checkWinCondition() {
    const safeCells = rows * cols - totalMines;
    if (cellsRevealed === safeCells) {
      gameWon = true;
      stopTimer();
      faceIconEl.textContent = "✓";
      statusLineEl.textContent = "área liberada";

      // marca automaticamente as minas restantes como bandeiras
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell.mine && !cell.flagged) {
            cell.flagged = true;
            updateCellDisplay(r, c);
          }
        }
      }
      mineCountEl.textContent = "000";

      recordGameResult(true);
      showOverlay(true);
    }
  }

  function showOverlay(won) {
    overlayEl.classList.add("is-visible");
    overlayMessageEl.textContent = won ? "ÁREA LIBERADA" : "FIM DE JOGO";
    overlayMessageEl.className = `overlay__message ${won ? "is-win" : "is-lose"}`;
    overlayDetailEl.textContent = won
      ? `tempo: ${String(secondsElapsed).padStart(3, "0")}s`
      : "tente novamente";
  }

  // ---------- temporizador ----------

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsElapsed++;
      timerEl.textContent = String(Math.min(secondsElapsed, 999)).padStart(3, "0");
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ---------- eventos globais ----------

  resetBtn.addEventListener("click", () => initGame());
  overlayBtn.addEventListener("click", () => initGame());

  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficultyBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      initGame(btn.dataset.level);
    });
  });

  // reseta o ícone do rosto ao pressionar o mouse em qualquer célula
  boardEl?.addEventListener?.("mousedown", () => {
    if (!gameOver && !gameWon) faceIconEl.textContent = "◉";
  });
  document.addEventListener("mouseup", () => {
    if (!gameOver && !gameWon) faceIconEl.textContent = "◔";
  });

  // ---------- start ----------

  initGame();
})();
