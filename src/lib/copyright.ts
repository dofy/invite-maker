export const COPYRIGHT_START_YEAR = 2026;

export function formatCopyright(hostname: string, currentYear = new Date().getFullYear()) {
  const endYear = Math.max(COPYRIGHT_START_YEAR, Math.trunc(currentYear));
  const years = endYear === COPYRIGHT_START_YEAR
    ? String(COPYRIGHT_START_YEAR)
    : `${COPYRIGHT_START_YEAR}–${endYear}`;
  const domain = hostname.trim() || 'Tsudoi';
  return `© ${years} ${domain}`;
}
