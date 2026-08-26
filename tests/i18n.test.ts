import { afterEach, describe, expect, it } from 'vitest';
import i18n, {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  resolveLanguage,
  translate,
} from '../src/i18n';

afterEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.removeItem(LANGUAGE_STORAGE_KEY);
});

describe('application languages', () => {
  it('supports all requested languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['zh-CN', 'zh-TW', 'en', 'de', 'ja', 'ko', 'es', 'fr']);
  });

  it('maps regional language codes to supported locales', () => {
    expect(resolveLanguage('zh-Hant-HK')).toBe('zh-TW');
    expect(resolveLanguage('zh-SG')).toBe('zh-CN');
    expect(resolveLanguage('de-CH')).toBe('de');
    expect(resolveLanguage('es-MX')).toBe('es');
    expect(resolveLanguage('pt-BR')).toBeNull();
  });

  it('keeps invitation variables literal while formatting UI values', async () => {
    await i18n.changeLanguage('ja');
    const t = i18n.getFixedT('ja');
    expect(t('editor.example')).toContain('{{csv.name}}');
    expect(translate(t, 'data.imported', { count: 12, type: 'CSV' })).toContain('12');
  });

  it('persists an explicit language choice', async () => {
    await i18n.changeLanguage('fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it.each(SUPPORTED_LANGUAGES)('provides visible UI copy for %s', (language) => {
    const t = i18n.getFixedT(language);
    expect(t('app.name')).not.toBe('app.name');
    expect(t('background.upload')).not.toBe('background.upload');
    expect(t('data.download')).not.toBe('data.download');
    expect(t('data.hint')).toContain('{{csv.');
  });

  it('uses Traditional Chinese terminology in the zh-TW interface', () => {
    const t = i18n.getFixedT('zh-TW');
    expect(t('theme.label')).toBe('外觀主題');
    expect(t('editor.tokenTxt')).toBe('TXT 資料');
  });
});
