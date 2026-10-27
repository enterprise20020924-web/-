let artwork: Promise<string> | null = null;
export function loadCampusMapArtwork() {
  if (artwork === null) {
    artwork = import('./generated/campus-image-payload')
      .then(async ({ campusImageUrl }) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = campusImageUrl;
        await image.decode();
        return campusImageUrl;
      })
      .catch(error => {
        artwork = null;
        throw error;
      });
  }
  return artwork;
}
