/** The accepted 2160×3840 framing also applies to proportional 1100px exports. */
export function isPortraitNineBySixteen(width: number, height: number) {
  return height > 0 && Math.abs(width / height - 9 / 16) < 0.005;
}

export function applyPortraitFraming(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  image.dataset.portraitFrame = isPortraitNineBySixteen(image.naturalWidth, image.naturalHeight) ? '9x16' : 'standard';
}
