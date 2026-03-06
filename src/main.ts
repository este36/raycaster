import './style.css'

const _factor = 1.2;
const WIDTH = 400 * _factor;
const HEIGHT = 300 * _factor;
let fps_printer: HTMLParagraphElement | null = null;
let frame_count = 0;


// const GRID_COLS = 10;
// const GRID_ROWS = 10;

type Renderer = {
  ctx: CanvasRenderingContext2D;
  img: ImageData;
  data: Uint8ClampedArray;
};

function putPixel(data: Uint8ClampedArray, x: number, y: number, r: number, g: number, b: number): void
{
  const index = (x + WIDTH * y) * 4;

  data[index]     = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = 0xff;
}

function render(r: Renderer): void
{
  const {ctx, img, data} = r;
  const perf1 = performance.now();

  for (let y = 0; y < HEIGHT; y++)
  {
    for (let x = 0; x < WIDTH; x++)
    {
      const r = (x % 0xff);
      const g = (y % 256);
      const b = 150;
      putPixel(data, x, y, r, g, b);
    }
  }

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

  fps_printer = document.querySelector('p');

  const loop = () => {
    render({ctx, img, data});
    requestAnimationFrame(loop);
  };
  loop();
}

main();
