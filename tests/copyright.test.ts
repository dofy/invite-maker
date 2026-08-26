import { describe, expect, it } from 'vitest';
import { formatCopyright } from '../src/lib/copyright';

describe('formatCopyright', () => {
  it('shows only the start year during 2026', () => {
    expect(formatCopyright('tsudoi.yahaha.net', 2026))
      .toBe('© 2026 tsudoi.yahaha.net');
  });

  it('adds the current year and uses the active hostname later', () => {
    expect(formatCopyright('tsudoi.phpz.org', 2029))
      .toBe('© 2026–2029 tsudoi.phpz.org');
  });
});
