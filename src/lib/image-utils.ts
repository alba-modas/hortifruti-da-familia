/**
 * Image processing utilities — client-side resize + WebP compression.
 * Generates two versions: thumbnail (~100KB) and full (~300KB).
 */

interface ProcessOptions {
  maxWidth: number;
  quality: number;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = url;
    });
    return img;
  } finally {
    // revoke after the image is loaded into memory
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function processToWebP(img: HTMLImageElement, opts: ProcessOptions): Promise<Blob> {
  const ratio = Math.min(1, opts.maxWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', opts.quality)
  );
  if (!blob) throw new Error('Falha ao gerar WebP');
  return blob;
}

export interface ProcessedImages {
  full: Blob;     // ~300KB, max 1200px, q=0.75
  thumb: Blob;    // ~100KB, max 600px, q=0.65
}

export async function processImage(file: File): Promise<ProcessedImages> {
  const img = await loadImage(file);
  const [full, thumb] = await Promise.all([
    processToWebP(img, { maxWidth: 1200, quality: 0.75 }),
    processToWebP(img, { maxWidth: 600, quality: 0.65 }),
  ]);
  return { full, thumb };
}
