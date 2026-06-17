const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const CELL = 20;
let COLS;
let ROWS;
let snake;
let dir;
let nextDir;
let food;
let score = 0;
let running = false;
let tickInterval = 100;
let loopId = null;

function resizeCanvas() {
  const shell = canvas.closest('.game-shell');
  const availableWidth = shell ? shell.clientWidth - 32 : window.innerWidth - 40;
  const maxSize = Math.min(availableWidth, window.innerHeight - 180, 640);
  const size = Math.max(300, maxSize);

  COLS = Math.floor(size / CELL);
  ROWS = Math.floor(size / CELL);
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
}

function resetGame() {
  resizeCanvas();
  tickInterval = 100;

  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);

  snake = [];
  for (let i = 0; i < 5; i++) {
    snake.push({ x: startX - i, y: startY });
  }

  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  score = 0;
  placeFood();
  updateScore();

  running = true;
  overlay.classList.add('hidden');

  if (loopId) clearInterval(loopId);
  loopId = setInterval(gameTick, tickInterval);
  draw();
}

function placeFood() {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);

    if (!snake.some(segment => segment.x === x && segment.y === y)) {
      food = { x, y };
      return;
    }
  }
}

function gameTick() {
  if (nextDir) dir = nextDir;

  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y
  };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver();
    return;
  }

  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    updateScore();
    placeFood();
    speedUp();
  } else {
    snake.pop();
  }

  draw();
}

function speedUp() {
  if (score % 5 !== 0 || tickInterval <= 42) return;

  tickInterval = Math.max(42, tickInterval - 8);
  clearInterval(loopId);
  loopId = setInterval(gameTick, tickInterval);
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function gameOver() {
  running = false;
  clearInterval(loopId);
  loopId = null;
  messageEl.textContent = `Game over - score: ${score}`;
  overlay.classList.remove('hidden');
}

function draw() {
  const styles = getComputedStyle(document.documentElement);
  const boardColor = styles.getPropertyValue('--game-bg').trim() || '#f7fee7';
  const gridColor = styles.getPropertyValue('--game-grid').trim() || 'rgba(21, 128, 61, 0.08)';
  const snakeColor = styles.getPropertyValue('--snake').trim() || '#22c55e';
  const snakeHeadColor = styles.getPropertyValue('--snake-head').trim() || '#15803d';
  const foodColor = styles.getPropertyValue('--potato').trim() || '#c0842f';

  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  drawPotato(food.x, food.y, foodColor);

  snake.forEach((segment, index) => {
    drawCell(
      segment.x,
      segment.y,
      index === 0 ? snakeHeadColor : snakeColor,
      index === 0 ? 6 : 5,
      2
    );
  });
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

function drawPotato(x, y, color) {
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.25);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(80, 48, 20, 0.35)';
  ctx.beginPath();
  ctx.arc(-2, -3, 1.1, 0, Math.PI * 2);
  ctx.arc(3, 1, 1, 0, Math.PI * 2);
  ctx.arc(-1, 4, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }

  if (!running && event.key === 'Enter') {
    resetGame();
    return;
  }

  if (event.key === 'ArrowUp' && dir.y !== 1) nextDir = { x: 0, y: -1 };
  if (event.key === 'ArrowDown' && dir.y !== -1) nextDir = { x: 0, y: 1 };
  if (event.key === 'ArrowLeft' && dir.x !== 1) nextDir = { x: -1, y: 0 };
  if (event.key === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
});

restartBtn.addEventListener('click', resetGame);

window.addEventListener('resize', () => {
  resetGame();
});

canvas.addEventListener('click', () => {
  canvas.focus();
});

resetGame();
