import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_ASSETS, selectRandomPlaceholder } from '../src/lib/placeholders';

describe('placeholder illustrations', () => {
  it('provides six assets for every canvas orientation', () => {
    expect(PLACEHOLDER_ASSETS).toHaveLength(18);
    expect(PLACEHOLDER_ASSETS.filter((asset) => asset.orientation === 'portrait')).toHaveLength(6);
    expect(PLACEHOLDER_ASSETS.filter((asset) => asset.orientation === 'landscape')).toHaveLength(6);
    expect(PLACEHOLDER_ASSETS.filter((asset) => asset.orientation === 'square')).toHaveLength(6);
  });

  it('selects from the complete collection and keeps matching canvas dimensions', () => {
    expect(selectRandomPlaceholder(() => 0)).toMatchObject({
      url: '/placeholders/portrait-01.webp', naturalWidth: 900, naturalHeight: 1200,
    });
    expect(selectRandomPlaceholder(() => 0.999999)).toMatchObject({
      url: '/placeholders/square-06.webp', naturalWidth: 1000, naturalHeight: 1000,
    });
  });
});
