import type { BackgroundModel } from '../model';
import { AppError } from './app-error';

export type PlaceholderOrientation = 'portrait' | 'landscape' | 'square';

interface PlaceholderAsset {
  url: string;
  orientation: PlaceholderOrientation;
  width: number;
  height: number;
}

const ORIENTATION_SIZE: Record<PlaceholderOrientation, { width: number; height: number }> = {
  portrait: { width: 900, height: 1200 },
  landscape: { width: 1200, height: 900 },
  square: { width: 1000, height: 1000 },
};

export const PLACEHOLDER_ASSETS: PlaceholderAsset[] = (
  ['portrait', 'landscape', 'square'] as const
).flatMap((orientation) => Array.from({ length: 6 }, (_, index) => ({
  url: `/placeholders/${orientation}-${String(index + 1).padStart(2, '0')}.webp`,
  orientation,
  ...ORIENTATION_SIZE[orientation],
})));

export function selectRandomPlaceholder(random = Math.random): BackgroundModel {
  const raw = random();
  const normalized = Number.isFinite(raw) ? Math.max(0, Math.min(0.999999, raw)) : 0;
  const asset = PLACEHOLDER_ASSETS[Math.floor(normalized * PLACEHOLDER_ASSETS.length)]
    ?? PLACEHOLDER_ASSETS[0];
  if (!asset) throw new AppError('errors.placeholder');

  return {
    url: asset.url,
    name: '',
    naturalWidth: asset.width,
    naturalHeight: asset.height,
    isPlaceholder: true,
  };
}
