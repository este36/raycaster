import './style.css'

const _factor = 2;
const WIDTH = 400 * _factor;
const HEIGHT = 300 * _factor;
let fps_printer: HTMLParagraphElement | null = null;
let player_printer: HTMLParagraphElement | null = null;
let frame_count = 0;

const map = [
  1,1,1,1,1,1,1,1,1,1,
  1,0,1,0,0,0,0,0,0,1,
  1,0,1,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,1,
  1,0,1,0,0,0,0,0,0,1,
  1,0,1,0,0,0,0,0,0,1,
  1,0,1,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,
];

const GRID_COLS = 10;
const GRID_ROWS = 10;
// const GRID_SIZE = GRID_ROWS*GRID_COLS;

const MINIMAP_WIDTH = Math.floor(WIDTH / 4);
const MINIMAP_HEIGHT = MINIMAP_WIDTH; // square for now

const CELL_WIDTH = MINIMAP_WIDTH / GRID_COLS;
const CELL_HEIGHT = MINIMAP_HEIGHT / GRID_ROWS;

const keys: Set<string> = new Set();

class Vector2
{
  public x: number;
  public y: number;
  constructor(x: number, y: number)
  {
    this.x = x;
    this.y = y;
  }
}

type Renderer = {
  ctx: CanvasRenderingContext2D;
  img: ImageData;
  data: Uint8ClampedArray;
  player: Vector2;
};

// function is_valid_point(x: number, y: number)
// {
// 	return x > 0 && x < WIDTH && y > 0 && y < HEIGHT;
// }

function putPixelRGB(data: Uint8ClampedArray, x: number, y: number, r: number, g: number, b: number): void
{
  const index = (x + WIDTH * y) * 4;

  data[index]     = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = 0xff;
}

function putPixel(data: Uint8ClampedArray, x: number, y: number, color: number): void
{
  const index = (x + WIDTH * y) * 4;

  data[index]     = (color >> 16) & 255;
  data[index + 1] = (color >> 8) & 255;
  data[index + 2] = color & 255;
  data[index + 3] = 0xff;
}

function drawRectangle(data: Uint8ClampedArray, startX: number, startY: number, width: number, height: number, color: number): void
{
  const y_end = startY + height;
  const x_end = startX + width;

  for (let y = startY; y < y_end; y++)
  {
    for (let x = startX; x < x_end; x++)
      putPixel(data, x, y, color);
  }
}

function drawLine(data: Uint8ClampedArray, p1: Vector2, p2: Vector2, color: number, thickness: number = 1)
{
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xInc = dx / steps;
    const yInc = dy / steps;
    let x = p1.x;
    let y = p1.y;

    for (let i = 0; i <= steps; i++)
    {
        for (let tx = -Math.floor(thickness/2); tx <= Math.floor(thickness/2); tx++)
        {
            for (let ty = -Math.floor(thickness/2); ty <= Math.floor(thickness/2); ty++)
                putPixel(data, x + tx, y + ty, color);
        }

        x += xInc;
        y += yInc;
    }
}

function drawMinimap(r: Renderer): void
{
  const { data, player } = r;

  const startX = WIDTH - MINIMAP_WIDTH - 5;
  const startY = HEIGHT - MINIMAP_HEIGHT - 5;

  drawRectangle(data, startX, startY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 0x181818);
  for (let y = 0; y < GRID_ROWS; y++)
  {
	  for (let x = 0; x < GRID_COLS; x++)
	  {
		  if (map[x+(y*GRID_COLS)] !== 0)
			  drawRectangle(data, startX + CELL_WIDTH*x, startY + CELL_HEIGHT*y, CELL_WIDTH, CELL_HEIGHT, 0xffcc11);
	  }
  }

  // Grid
  // const gridColor = 0x999999;
  // let gridY = startY;
  // for (let i = 0; i < GRID_COLS; i++)
  // {
  // 	drawLine(data, new Vector2(startX, gridY), new Vector2(startX + MINIMAP_WIDTH, gridY), gridColor);
  //   gridY += CELL_HEIGHT;
  // }
  // drawLine(data, new Vector2(startX, gridY), new Vector2(startX + MINIMAP_WIDTH, gridY), gridColor);
  // let gridX = startX;
  // for (let i = 0; i < GRID_ROWS; i++)
  // {
  // 	drawLine(data, new Vector2(gridX, startY), new Vector2(gridX, startY + MINIMAP_HEIGHT), gridColor);
  //   gridX += CELL_WIDTH;
  // }
  // drawLine(data, new Vector2(gridX, startY), new Vector2(gridX, startY + MINIMAP_HEIGHT), gridColor);

  // Player
  const player_size = 5;
  const px = Math.floor(startX + player.x*CELL_WIDTH);
  const py = Math.floor(startY + player.y*CELL_HEIGHT);
  drawRectangle(data, px, py, player_size, 5, 0xff0000);
}

function not_hitting_wall(playerX: number, playerY: number)
{
	const px = Math.floor(playerX);
	const py = Math.floor(playerY);
	console.log(px, py);
	return (
		px >= 0 && py >= 0
		&& py < GRID_ROWS && px < GRID_COLS
		&& map[px + (py*GRID_COLS)] === 0
	);
}

function render(r: Renderer): void
{
  const {ctx, img, data} = r;
  const perf1 = performance.now();

  for (let y = 0; y < HEIGHT; y++)
  {
    for (let x = 0; x < WIDTH; x++)
    {
      const r = (Math.sqrt(x*x + y*y) + frame_count) % 256;
      const g = ((y * Math.log(frame_count)) % 256);
      const b = 150;
      putPixelRGB(data, x, y, r, g, b);
    }
  }

  const step = 0.03;
  if (not_hitting_wall(r.player.x, r.player.y - step)
	&& (keys.has('ArrowUp') || keys.has('w'))) r.player.y -= step;
  if (not_hitting_wall(r.player.x, r.player.y + step)
	&& (keys.has('ArrowDown') || keys.has('s'))) r.player.y += step;
  if (not_hitting_wall(r.player.x - step, r.player.y)
	&& (keys.has('ArrowLeft') || keys.has('a'))) r.player.x -= step;
  if (not_hitting_wall(r.player.x + step, r.player.y)
	&& (keys.has('ArrowRight') || keys.has('d'))) r.player.x += step;
  drawMinimap(r);

  ctx.putImageData(img, 0, 0);
  const elapsed = performance.now() - perf1;
  const fps = Math.round(1000 / elapsed * 100) / 100;
  frame_count++;
  if (fps_printer && frame_count % 10 === 0)
    fps_printer.textContent = `${fps.toString()} FPS`;
  if (player_printer)
	  player_printer.textContent = `Player: x=${Math.round(r.player.x * 100) / 100}, y=${Math.round(r.player.y * 100) / 100}`;
}

function main(): void
{
  const canvas = document.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) throw new Error("canvas");

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context");

  ctx.fillStyle = "Green";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const img = ctx.createImageData(WIDTH, HEIGHT);
  const data = img.data;
  if (!data)
    throw new Error("image data");

  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    keys.add(e.key);
  });
  document.addEventListener("keyup", (e) => {
    e.preventDefault();
    keys.delete(e.key);
  });

  fps_printer = document.querySelector('#fps');
  player_printer = document.querySelector('#player');

  const player = new Vector2(5.5, 5.5);

  const loop = () => {
    render({ctx, img, data, player});
    requestAnimationFrame(loop);
  };
  loop();
}

main();
