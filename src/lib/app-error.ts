import type { TFunction } from 'i18next';
import type { TranslationKey } from '../i18n/resources';
import { translate } from '../i18n';

export class AppError extends Error {
  constructor(
    readonly translationKey: TranslationKey,
    readonly values: Record<string, unknown> = {},
  ) {
    super(translationKey);
    this.name = 'AppError';
  }
}

export function translateError(error: unknown, t: TFunction) {
  if (error instanceof AppError) return translate(t, error.translationKey, error.values as Record<string, string | number>);
  if (error instanceof Error && error.message) return error.message;
  return t('toast.unknown');
}
