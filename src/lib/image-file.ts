import type { BackgroundModel } from '../model';

export async function backgroundFromFile(file: File): Promise<BackgroundModel> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件');
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
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function releaseBackground(background: BackgroundModel) {
  if (!background.isPlaceholder && background.url.startsWith('blob:')) URL.revokeObjectURL(background.url);
}
