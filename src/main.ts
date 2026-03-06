import './style.css'

const _factor = 2;
const WIDTH = 400 * _factor;
const HEIGHT = 300 * _factor;
let fps_printer: HTMLParagraphElement | null = null;
let frame_count = 0;

// const map = [
//   1,1,1,1,1,1,1,1,1,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,1,
//   1,1,1,1,1,1,1,1,1,1,
// ];

const GRID_COLS = 10;
const GRID_ROWS = 10;

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

function drawMinimap(r: Renderer): void
{
  const { data, player } = r;

  const startX = WIDTH - MINIMAP_WIDTH - 5;
  const startY = HEIGHT - MINIMAP_HEIGHT - 5;

  let y = startY;
  let y_dist = 0;

  while (y_dist < MINIMAP_HEIGHT)
  {
      let x_dist = 0;
      let x = startX;

      y_dist = Math.abs(startY - y);
      while (x_dist < MINIMAP_WIDTH)
      {
        x_dist = Math.abs(startX - x);
        if (x_dist % CELL_WIDTH < 0.1)
        {
          putPixel(data, x, y, 0x999999);
        }
        else if (y_dist % CELL_HEIGHT < 0.1)
        {
          putPixel(data, x, y, 0x999999);
        }
        else
        {
          putPixel(data, x, y, 0x181818);
        }
        x++;
      }
      y++;
  }
  const player_size = 5;
  if (player.x === -1 || player.y === -1)
  {
    player.x = startX + Math.floor(MINIMAP_WIDTH / 2) - Math.floor(player_size / 2);
    player.y = startY + Math.floor(MINIMAP_HEIGHT / 2) - Math.floor(player_size / 2);
  }
  drawRectangle(
    data,
    player.x,
    player.y,
    player_size,
    5,
    0xff0000);
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

  if (keys.has('ArrowUp')) r.player.y--;
  if (keys.has('ArrowDown')) r.player.y++;
  if (keys.has('ArrowLeft')) r.player.x--;
  if (keys.has('ArrowRight')) r.player.x++;
  drawMinimap(r);

  ctx.putImageData(img, 0, 0);
  const elapsed = performance.now() - perf1;
  const fps = Math.round(1000 / elapsed * 100) / 100;
  frame_count++;
  if (fps_printer && frame_count % 10 === 0)
    fps_printer.textContent = `${fps.toString()} FPS`;
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

  // for (let y = 0; y < GRID_COLS; y++)
  // {
  //   for (let x = 0; x < GRID_ROWS; x++)
  //   {
  //     putPixel(imgData, {x, y}, { r: (x % 0xff), g: (y % 256), b: 150});
  //   }
  // }

  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    keys.add(e.key);
  });
  document.addEventListener("keyup", (e) => {
    e.preventDefault();
    keys.delete(e.key);
  });

  fps_printer = document.querySelector('#fps');

  const player = new Vector2(-1, -1);

  const loop = () => {
    render({ctx, img, data, player});
    requestAnimationFrame(loop);
  };
  loop();
}

main();
