import type { LocalizedLabels } from '#shared/types/datavizSchema.js';

type LocalizableItem = {
  label: string;
  labels?: LocalizedLabels;
};

export const resolveLocalizedLabel = (
  item: LocalizableItem,
  locale: string,
  defaultLocale: string
): string => item.labels?.[locale] ?? item.labels?.[defaultLocale] ?? item.label;
