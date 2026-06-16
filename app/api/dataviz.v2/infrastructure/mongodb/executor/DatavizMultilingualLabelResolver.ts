import { TranslationCollection } from '#api/i18n.v2/model/TranslationCollection.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  formatDatavizDateLabel,
  formatDatavizDateRangeLabel,
  formatDatavizDimensionKeyLabel,
  isDatavizDateRangeKey,
  normalizeDatavizBucketKey,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import {
  DATAVIZ_MISSING_BUCKET_KEY,
  DATAVIZ_MISSING_BUCKET_LABEL,
  isDatavizMissingBucketKey,
} from '#shared/dataviz/missingBucket.js';
import type { DimensionSpec, LocalizedLabels } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';

type ThesaurusLabelContext = {
  valueLabels: Map<string, string>;
  translations: TranslationCollection;
};

export type DatavizMultilingualLabelContext = {
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  templateNames: Map<string, string>;
  templateTranslations: Map<string, TranslationCollection>;
  propertyThesaurus: Map<string, ThesaurusLabelContext>;
  relatedEntityProperties: Set<string>;
  entityTitles: Map<string, LocalizedLabels>;
  missingBucketLabels: LocalizedLabels;
};

export type MultilingualLabelResolver = (dim: DimensionSpec, key: unknown) => LocalizedLabels;

const toLocale = (language: LanguageISO6391): string => language;

const fillLanguages = (
  languages: LanguageISO6391[],
  build: (language: LanguageISO6391) => string
): LocalizedLabels => {
  const labels: LocalizedLabels = {};
  languages.forEach(language => {
    labels[language] = build(language);
  });
  return labels;
};

const resolveTemplateLabels = (
  templateId: string,
  ctx: DatavizMultilingualLabelContext
): LocalizedLabels => {
  const canonical = ctx.templateNames.get(templateId) ?? templateId;
  const translations = ctx.templateTranslations.get(templateId);

  return fillLanguages(ctx.languages, language =>
    translations?.getTranslation(language, canonical, canonical) ?? canonical
  );
};

const resolveThesaurusLabels = (
  thesaurus: ThesaurusLabelContext,
  valueId: string,
  languages: LanguageISO6391[]
): LocalizedLabels => {
  const canonical = thesaurus.valueLabels.get(valueId) ?? valueId;

  return fillLanguages(languages, language =>
    thesaurus.translations.getTranslation(language, canonical, canonical)
  );
};

const resolveDateLabels = (
  key: unknown,
  dim: DimensionSpec,
  languages: LanguageISO6391[]
): LocalizedLabels => {
  const normalizedKey = normalizeDatavizBucketKey(key);
  const { propertyType } = dim;
  const interval = dim.dateInterval ?? 'year';

  if (propertyType === 'date' || propertyType === 'multidate') {
    if (interval === 'computed_years' && typeof normalizedKey === 'number') {
      return fillLanguages(languages, () => String(normalizedKey));
    }
    if (interval === 'week' && typeof normalizedKey === 'string') {
      return fillLanguages(languages, () => normalizedKey);
    }
    if (interval === 'year' && typeof normalizedKey === 'number') {
      return fillLanguages(languages, () => String(normalizedKey));
    }
    if (interval === 'month' && typeof normalizedKey === 'string') {
      return fillLanguages(languages, () => normalizedKey);
    }
    if (typeof normalizedKey === 'number') {
      return fillLanguages(languages, language =>
        formatDatavizDateLabel(normalizedKey, toLocale(language))
      );
    }
  }

  if (propertyType === 'daterange' || propertyType === 'multidaterange') {
    if (interval === 'computed_years' && typeof normalizedKey === 'number') {
      return fillLanguages(languages, () => String(normalizedKey));
    }
    if (interval === 'week' && typeof normalizedKey === 'string') {
      return fillLanguages(languages, () => normalizedKey);
    }
    if (interval === 'year' && typeof normalizedKey === 'number') {
      return fillLanguages(languages, () => String(normalizedKey));
    }
    if (interval === 'month' && typeof normalizedKey === 'string') {
      return fillLanguages(languages, () => normalizedKey);
    }
    if (typeof normalizedKey === 'number') {
      return fillLanguages(languages, language =>
        formatDatavizDateLabel(normalizedKey, toLocale(language))
      );
    }
    if (isDatavizDateRangeKey(normalizedKey)) {
      return fillLanguages(languages, language =>
        formatDatavizDateRangeLabel(normalizedKey, toLocale(language))
      );
    }
  }

  return fillLanguages(languages, () => String(normalizedKey));
};

const resolveEntityTitleLabels = (
  sharedId: string,
  ctx: DatavizMultilingualLabelContext
): LocalizedLabels => {
  const stored = ctx.entityTitles.get(sharedId);
  if (stored) {
    return fillLanguages(ctx.languages, language => stored[language] ?? stored[ctx.defaultLanguage] ?? sharedId);
  }

  return fillLanguages(ctx.languages, () => sharedId);
};

export const buildMissingBucketLabels = (languages: LanguageISO6391[]): LocalizedLabels =>
  fillLanguages(languages, () => DATAVIZ_MISSING_BUCKET_LABEL);

export const createMultilingualLabelResolver = (
  ctx: DatavizMultilingualLabelContext
): MultilingualLabelResolver => {
  return (dim: DimensionSpec, key: unknown): LocalizedLabels => {
    const normalizedKey = normalizeDatavizBucketKey(key);

    if (
      isDatavizMissingBucketKey(normalizedKey as string | number | null | undefined) ||
      normalizedKey === DATAVIZ_MISSING_BUCKET_KEY
    ) {
      return ctx.missingBucketLabels;
    }

    if (dim.property === TEMPLATE_DIMENSION_PROPERTY) {
      return resolveTemplateLabels(String(normalizedKey), ctx);
    }

    if (dim.relationshipMode === 'related_entity') {
      return resolveEntityTitleLabels(String(normalizedKey), ctx);
    }

    if (
      dim.propertyType === 'date' ||
      dim.propertyType === 'multidate' ||
      dim.propertyType === 'daterange' ||
      dim.propertyType === 'multidaterange'
    ) {
      return resolveDateLabels(normalizedKey, dim, ctx.languages);
    }

    const thesaurus = ctx.propertyThesaurus.get(dim.property);
    if (thesaurus && (typeof normalizedKey === 'string' || typeof normalizedKey === 'number')) {
      return resolveThesaurusLabels(thesaurus, String(normalizedKey), ctx.languages);
    }

    const fallback = formatDatavizDimensionKeyLabel(normalizedKey, {
      propertyType: dim.propertyType,
      dateInterval: dim.dateInterval,
    });

    return fillLanguages(ctx.languages, () => fallback);
  };
};

export const resolveSeriesLocalizedLabels = (
  templateId: string,
  alias: string | undefined,
  templateCount: number,
  ctx: DatavizMultilingualLabelContext
): LocalizedLabels => {
  const templateLabels = resolveTemplateLabels(templateId, ctx);

  if (templateCount > 1 && alias) {
    return fillLanguages(
      ctx.languages,
      language => `${templateLabels[language] ?? templateId} (${alias})`
    );
  }

  return templateLabels;
};

export const pickDefaultLocalizedLabel = (
  labels: LocalizedLabels,
  defaultLanguage: LanguageISO6391,
  fallback = ''
): string => labels[defaultLanguage] ?? Object.values(labels).find(Boolean) ?? fallback;
