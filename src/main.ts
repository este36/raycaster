import './style.css'

const _factor = 1.2;
const WIDTH = 400 * _factor;
const HEIGHT = 300 * _factor;

function main(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) throw new Error("canvas");

  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${HEIGHT}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context");

  ctx.fillStyle = "Green";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  console.log(ctx)
}

document.addEventListener('DOMContentLoaded', main);
