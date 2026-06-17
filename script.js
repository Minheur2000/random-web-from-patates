// Basic Snake game: arrow keys controls, simple theme and sizing
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const CELL = 20; // cell size in pixels (basic)
let COLS, ROWS;
let widthPx = 600; // preferred canvas size
let heightPx = 600;
let snake;
let dir; // {x, y}
let nextDir;
let food;
let score = 0;
let running = false;
let tickInterval = 100; // ms per frame (speed)
let loopId = null;

function resizeCanvas() {
  const maxSize = Math.min(window.innerWidth - 40, 720);
  widthPx = maxSize;
  heightPx = Math.min(maxSize, window.innerHeight - 160);
  COLS = Math.floor(widthPx / CELL) || 20;
  ROWS = Math.floor(heightPx / CELL) || 20;
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
}

function resetGame() {
  resizeCanvas();
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [];
  for (let i = 0; i < 5; i++) snake.push({ x: startX - i, y: startY });
  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  placeFood();
  score = 0;
  updateScore();
  running = true;
  if (loopId) clearInterval(loopId);
  loopId = setInterval(gameTick, tickInterval);
  overlay.classList.add('hidden');
}

function placeFood() {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!snake.some(s => s.x === x && s.y === y)) {
      food = { x, y };
      break;
    }
  }
}

function gameTick() {
  // apply next direction (to avoid reversing in same tick)
  if (nextDir) dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // wall collision = game over
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return gameOver();
  }

  // self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);
  // eat food
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    updateScore();
    placeFood();
    // optionally speed up slightly
    if (score % 5 === 0 && tickInterval > 40) {
      tickInterval = Math.max(40, tickInterval - 8);
      clearInterval(loopId);
      loopId = setInterval(gameTick, tickInterval);
    }
  } else {
    snake.pop();
  }

  draw();
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function gameOver() {
  running = false;
  clearInterval(loopId);
  messageEl.textContent = `Game over - score: ${score}`;
  overlay.classList.remove('hidden');
}

function draw() {
  const styles = getComputedStyle(document.documentElement);
  const boardColor = styles.getPropertyValue('--bg').trim() || '#fff';
  const gridColor = styles.getPropertyValue('--grid').trim() || '#f3f4f6';
  const snakeColor = styles.getPropertyValue('--snake').trim() || '#16a34a';
  const snakeHeadColor = styles.getPropertyValue('--snake-head').trim() || snakeColor;
  const foodColor = styles.getPropertyValue('--food').trim() || '#ef4444';

  // background
  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid (optional subtle)
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += CELL) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += CELL) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }

  // food
  drawCell(food.x, food.y, foodColor, 7, 4);

  // snake
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    drawCell(s.x, s.y, i === 0 ? snakeHeadColor : snakeColor, 5, 2);
  }
}

function drawCell(x, y, color, radius, inset) {
  const px = x * CELL + inset;
  const py = y * CELL + inset;
  const size = CELL - inset * 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px, py, size, size, radius);
  } else {
    ctx.rect(px, py, size, size);
  }
  ctx.fill();
}

window.addEventListener('keydown', (e) => {
  if (!running && e.key === 'ArrowUp') return; // ignore when not running
  const k = e.key;
  if (k === 'ArrowUp' && dir.y !== 1) nextDir = { x: 0, y: -1 };
  if (k === 'ArrowDown' && dir.y !== -1) nextDir = { x: 0, y: 1 };
  if (k === 'ArrowLeft' && dir.x !== 1) nextDir = { x: -1, y: 0 };
  if (k === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
});

restartBtn.addEventListener('click', () => { resetGame(); });

window.addEventListener('resize', () => {
  // on resize keep current state but recompute grid; safer to restart
  resetGame();
});

// init
resizeCanvas();
resetGame();

// focus canvas for keyboard on click
canvas.addEventListener('click', () => canvas.focus());
