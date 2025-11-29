// Състояния на клетките
const CELL_EMPTY = 0; // сиво, няма дърво
const CELL_TREE = 1;  // зелено, има дърво
const CELL_BURNING = 2; // жълто, гори за 0.2 секунди (2 под-тикове по 0.1s)
const CELL_FIREFIGHTER = 3; // червено, пожарникар

const canvas = document.getElementById('forestCanvas');
const ctx = canvas.getContext('2d');

const cellSizeInput = document.getElementById('cellSize');
const gridSizeInput = document.getElementById('gridSize');
const growthProbInput = document.getElementById('growthProb');
const lightningProbInput = document.getElementById('lightningProb');
const firefighterDelayInput = document.getElementById('firefighterDelay');
const firefighterDurationInput = document.getElementById('firefighterDuration');
const firefighterRangeInput = document.getElementById('firefighterRange');

const cellSizeValue = document.getElementById('cellSizeValue');
const gridSizeValue = document.getElementById('gridSizeValue');
const growthProbValue = document.getElementById('growthProbValue');
const lightningProbValue = document.getElementById('lightningProbValue');
const firefighterDelayValue = document.getElementById('firefighterDelayValue');
const firefighterDurationValue = document.getElementById('firefighterDurationValue');
const firefighterRangeValue = document.getElementById('firefighterRangeValue');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

const treesCountSpan = document.getElementById('treesCount');
const lastLightningSpan = document.getElementById('lastLightning');

let gridSize = parseInt(gridSizeInput.value, 10);
let cellSize = parseInt(cellSizeInput.value, 10);
let growthProb = parseInt(growthProbInput.value, 10) / 100.0; // на тик (1 секунда)
let lightningProb = parseInt(lightningProbInput.value, 10) / 100.0; // на тик (1 секунда)
let firefighterDelaySec = parseInt(firefighterDelayInput.value, 10); // след колко секунди от началото на пожара
let firefighterDurationSec = parseInt(firefighterDurationInput.value, 10); // колко секунди стои
let firefighterRange = parseInt(firefighterRangeInput.value, 10); // радиус в клетки

let grid = [];
let mainTickInterval = null; // 1s тик
let subTickInterval = null;  // 0.1s тик
let running = false;

// за да можем да знаем кои клетки горят и колко време им остава (в под-тикове по 0.1s)
// key -> remainingSubTicks
let burningCells = new Map();

const BURN_SUBTICKS = 2; // 2 * 0.1s = 0.2s

// Пожарникар (един за момента)
let firefighterActive = false;
let firefighterRow = -1;
let firefighterCol = -1;
let firefighterRemainingSec = 0; // колко секунди му остават

// Таймер за първи пожар
let firstFireSeen = false;
let firstFireSecond = 0; // в основни тикове (секунди)
let mainTickCounter = 0;

function createGrid() {
  grid = new Array(gridSize);
  for (let r = 0; r < gridSize; r++) {
    grid[r] = new Array(gridSize).fill(CELL_EMPTY);
  }
  burningCells.clear();
}

function resizeCanvas() {
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
}

function drawGrid() {
  const emptyColor = '#6b7280';
  const treeColor = '#22c55e';
  const burningColor = '#facc15';
  const firefighterColor = '#ef4444';
  const firefighterZoneColor = 'rgba(59, 130, 246, 0.5)';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let treesCount = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      let state = grid[r][c];
      let color = emptyColor;
      if (state === CELL_TREE) {
        color = treeColor;
        treesCount++;
      } else if (state === CELL_BURNING) {
        color = burningColor;
      } else if (state === CELL_FIREFIGHTER) {
        color = firefighterColor;
      }
      ctx.fillStyle = color;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

      // Визуализация на зоната на пожарникаря (вода) с 50% прозрачност
      if (firefighterActive && isInsideFirefighterZone(r, c)) {
        ctx.fillStyle = firefighterZoneColor;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      // Малка "картинка" за пожарникаря върху неговата клетка, с 50% прозрачност
      if (state === CELL_FIREFIGHTER) {
        const centerX = c * cellSize + cellSize / 2;
        const centerY = r * cellSize + cellSize / 2;
        const radius = Math.min(cellSize, cellSize) * 0.3;

        ctx.save();
        ctx.globalAlpha = 0.5;

        // шлем (полуовал)
        ctx.beginPath();
        ctx.fillStyle = firefighterColor;
        ctx.ellipse(centerX, centerY - radius * 0.2, radius, radius * 0.7, 0, Math.PI, 0, true);
        ctx.fill();

        // лице (кръг)
        ctx.beginPath();
        ctx.fillStyle = '#fde68a';
        ctx.arc(centerX, centerY + radius * 0.1, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  treesCountSpan.textContent = String(treesCount);
}

function randomChance(prob) {
  return Math.random() < prob;
}

function keyFor(r, c) {
  return r + ',' + c;
}

function parseKey(key) {
  const [r, c] = key.split(',').map(Number);
  return { r, c };
}

// Основен тик (1 секунда)
function mainTick() {
  mainTickCounter++;

  // 1) Растеж на дървета в празни клетки
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === CELL_EMPTY) {
        if (randomChance(growthProb)) {
          grid[r][c] = CELL_TREE;
        }
      }
    }
  }

  // 2) Светкавица
  if (randomChance(lightningProb)) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);

    const timeStr = new Date().toLocaleTimeString();
    lastLightningSpan.textContent = `${timeStr} (r=${r}, c=${c})`;

    if (grid[r][c] === CELL_TREE) {
      igniteCell(r, c);
      // пали само директните съседи (4-посочно)
      const neighbors = [
        { dr: -1, dc: 0 }, // горе
        { dr: 1, dc: 0 },  // долу
        { dr: 0, dc: -1 }, // ляво
        { dr: 0, dc: 1 }   // дясно
      ];
      for (const { dr, dc } of neighbors) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
          if (grid[nr][nc] === CELL_TREE) {
            igniteCell(nr, nc);
          }
        }
      }

      if (!firstFireSeen) {
        firstFireSeen = true;
        firstFireSecond = mainTickCounter;
      }
    }
  }

  // 3) Поява и живот на пожарникар
  updateFirefighter();

  drawGrid();
}

function igniteCell(r, c) {
  if (grid[r][c] === CELL_FIREFIGHTER) {
    return;
  }
  if (firefighterActive && isInsideFirefighterZone(r, c)) {
    return;
  }
  grid[r][c] = CELL_BURNING;
  burningCells.set(keyFor(r, c), BURN_SUBTICKS);
}

// Междинен тик (0.1 секунда): горящите клетки палят съседите си и изгарят след 0.2s
function subTick() {
  if (burningCells.size === 0) {
    return;
  }

  const currentBurning = Array.from(burningCells.entries());

  for (const [key, remaining] of currentBurning) {
    const { r, c } = parseKey(key);
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      burningCells.delete(key);
      continue;
    }

    if (grid[r][c] !== CELL_BURNING) {
      burningCells.delete(key);
      continue;
    }

    const neighbors = [
      { dr: -1, dc: 0 }, // горе
      { dr: 1, dc: 0 },  // долу
      { dr: 0, dc: -1 }, // ляво
      { dr: 0, dc: 1 }   // дясно
    ];

    for (const { dr, dc } of neighbors) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        if (grid[nr][nc] === CELL_TREE) {
          igniteCell(nr, nc);
        }
      }
    }

    const newRemaining = remaining - 1;
    if (newRemaining <= 0) {
      grid[r][c] = CELL_EMPTY; // изгорява и става празно (сиво)
      burningCells.delete(key);
    } else {
      burningCells.set(key, newRemaining);
    }
  }

  drawGrid();
}

function updateFirefighter() {
  if (firstFireSeen && !firefighterActive) {
    const secondsSinceFirstFire = mainTickCounter - firstFireSecond;
    if (secondsSinceFirstFire >= firefighterDelaySec) {
      spawnFirefighter();
    }
  }

  if (firefighterActive) {
    firefighterRemainingSec -= 1;
    if (firefighterRemainingSec <= 0) {
      if (
        firefighterRow >= 0 &&
        firefighterRow < gridSize &&
        firefighterCol >= 0 &&
        firefighterCol < gridSize
      ) {
        if (grid[firefighterRow][firefighterCol] === CELL_FIREFIGHTER) {
          grid[firefighterRow][firefighterCol] = CELL_EMPTY;
        }
      }
      firefighterActive = false;
    }
  }
}

function spawnFirefighter() {
  // Случайно място на картата
  const r = Math.floor(Math.random() * gridSize);
  const c = Math.floor(Math.random() * gridSize);

  firefighterRow = r;
  firefighterCol = c;
  firefighterRemainingSec = firefighterDurationSec;
  firefighterActive = true;

  grid[r][c] = CELL_FIREFIGHTER;

  // Ако вътре в радиуса има горящи клетки по време на появата, ги връщаме на дърво
  const keys = Array.from(burningCells.keys());
  for (const key of keys) {
    const { r: br, c: bc } = parseKey(key);
    if (isInsideFirefighterZone(br, bc)) {
      grid[br][bc] = CELL_TREE;
      burningCells.delete(key);
    }
  }
}

function isInsideFirefighterZone(r, c) {
  if (!firefighterActive) return false;
  const dr = Math.abs(r - firefighterRow);
  const dc = Math.abs(c - firefighterCol);
  return Math.max(dr, dc) <= firefighterRange;
}

function startSimulation() {
  if (running) return;
  running = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  mainTickInterval = setInterval(mainTick, 1000);
  subTickInterval = setInterval(subTick, 100);
}

function stopSimulation() {
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (mainTickInterval !== null) {
    clearInterval(mainTickInterval);
    mainTickInterval = null;
  }
  if (subTickInterval !== null) {
    clearInterval(subTickInterval);
    subTickInterval = null;
  }
}

function resetSimulation() {
  stopSimulation();
  createGrid();
  drawGrid();
  lastLightningSpan.textContent = 'няма';
  firstFireSeen = false;
  mainTickCounter = 0;
  firefighterActive = false;
}

// Обработка на промени по контролите
cellSizeInput.addEventListener('input', () => {
  cellSize = parseInt(cellSizeInput.value, 10);
  cellSizeValue.textContent = String(cellSize);
  resizeCanvas();
  drawGrid();
});

gridSizeInput.addEventListener('input', () => {
  gridSize = parseInt(gridSizeInput.value, 10);
  gridSizeValue.textContent = String(gridSize);
  createGrid();
  resizeCanvas();
  drawGrid();
});

growthProbInput.addEventListener('input', () => {
  growthProb = parseInt(growthProbInput.value, 10) / 100.0;
  growthProbValue.textContent = String(growthProbInput.value);
});

lightningProbInput.addEventListener('input', () => {
  lightningProb = parseInt(lightningProbInput.value, 10) / 100.0;
  lightningProbValue.textContent = String(lightningProbInput.value);
});

firefighterDelayInput.addEventListener('input', () => {
  firefighterDelaySec = parseInt(firefighterDelayInput.value, 10);
  firefighterDelayValue.textContent = String(firefighterDelayInput.value);
});

firefighterDurationInput.addEventListener('input', () => {
  firefighterDurationSec = parseInt(firefighterDurationInput.value, 10);
  firefighterDurationValue.textContent = String(firefighterDurationInput.value);
});

firefighterRangeInput.addEventListener('input', () => {
  firefighterRange = parseInt(firefighterRangeInput.value, 10);
  firefighterRangeValue.textContent = String(firefighterRangeInput.value);
});

startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);
resetBtn.addEventListener('click', resetSimulation);

// Инициализация
cellSizeValue.textContent = String(cellSize);
gridSizeValue.textContent = String(gridSize);
growthProbValue.textContent = String(growthProbInput.value);
lightningProbValue.textContent = String(lightningProbInput.value);
firefighterDelayValue.textContent = String(firefighterDelayInput.value);
firefighterDurationValue.textContent = String(firefighterDurationInput.value);
firefighterRangeValue.textContent = String(firefighterRangeInput.value);

createGrid();
resizeCanvas();
drawGrid();
