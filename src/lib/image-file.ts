import type { BackgroundModel } from '../model';
import { AppError } from './app-error';

export async function backgroundFromFile(file: File): Promise<BackgroundModel> {
  if (!file.type.startsWith('image/')) throw new AppError('errors.imageFile');
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
    return {
      url,
      name: file.name,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      isPlaceholder: false,
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new AppError('errors.imageDecode');
  }
}

export function releaseBackground(background: BackgroundModel) {
  if (!background.isPlaceholder && background.url.startsWith('blob:')) URL.revokeObjectURL(background.url);
}
