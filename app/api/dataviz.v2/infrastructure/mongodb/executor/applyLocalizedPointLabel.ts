import { datavizBucketLabel } from '#shared/dataviz/missingBucket.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { DimensionSpec, LocalizedLabels } from '#shared/types/datavizSchema.js';
import type { MultilingualLabelResolver } from './DatavizMultilingualLabelResolver.js';
import { pickDefaultLocalizedLabel } from './DatavizMultilingualLabelResolver.js';

export const applyLocalizedPointLabels = (
  key: unknown,
  dim: DimensionSpec,
  resolveLabels: MultilingualLabelResolver,
  defaultLanguage: LanguageISO6391,
  missingBucketLabels: LocalizedLabels
): { label: string; labels: LocalizedLabels } => {
  const resolved = resolveLabels(dim, key);
  const labels: LocalizedLabels = {};

  Object.entries(resolved).forEach(([language, text]) => {
    if (text === undefined) {
      return;
    }
    labels[language] = datavizBucketLabel(
      key,
      text,
      missingBucketLabels[language] ?? missingBucketLabels[defaultLanguage]
    );
  });

  return {
    labels,
    label: pickDefaultLocalizedLabel(labels, defaultLanguage, String(key)),
  };
};
