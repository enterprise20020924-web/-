import { campusContours } from './campus-map-contours';

let cachedMask: Promise<string> | undefined;

/** Fade only the outer sea into the surrounding canvas; keep the original PNG intact. */
export function loadCampusOceanMask(source: string): Promise<string> {
  cachedMask ??= createOceanMask(source).catch(error => {
    cachedMask = undefined;
    throw error;
  });
  return cachedMask;
}

async function createOceanMask(source: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = source;
  await image.decode();
  const canvas = document.createElement('canvas');
  const width = (canvas.width = image.naturalWidth);
  const height = (canvas.height = image.naturalHeight);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return '';
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const feather = 48;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const distance = Math.min(x, width - 1 - x, y, height - 1 - y);
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      const sea = red < 85 && green > 125 && blue > 185 && blue - red > 125;
      const progress = sea ? Math.min(1, distance / feather) : 1;
      pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = 255;
      pixels.data[index + 3] = Math.round(255 * progress * progress * (3 - 2 * progress));
    }
  }
  context.putImageData(pixels, 0, 0);
  // Blue glass roofs share sea colours. Explicit silhouettes protect them, the
  // hilltop and the entrance bridge, including their antialiased boundary pixels.
  context.fillStyle = context.strokeStyle = '#fff';
  context.lineWidth = 4;
  for (const outline of Object.values(campusContours)) {
    const path = new Path2D(outline);
    context.fill(path);
    context.stroke(path);
  }
  return canvas.toDataURL('image/png');
}
