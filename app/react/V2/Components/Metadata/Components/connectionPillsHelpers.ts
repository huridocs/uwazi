import type { RelatedRelationshipMetadataProperty } from '#V2/formatters/types.js';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

const titleCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

const FOLD_COUNT = 8;

const sortRelationshipValues = (values: RelationshipEntityValue[]): RelationshipEntityValue[] =>
  [...values].sort((left, right) => titleCollator.compare(left.title, right.title));

const resolvedTemplateId = (value: RelationshipEntityValue, targetTemplateId?: string): string =>
  value.templateId || targetTemplateId || '';

/** The one template every linked entity shares, or undefined when they mix. */
const sharedRelationshipTemplateId = (
  values: RelationshipEntityValue[],
  targetTemplateId?: string
): string | undefined => {
  if (!values.length) {
    return undefined;
  }
  const first = resolvedTemplateId(values[0], targetTemplateId);
  if (!first) {
    return undefined;
  }
  return values.every(value => resolvedTemplateId(value, targetTemplateId) === first)
    ? first
    : undefined;
};

export { FOLD_COUNT, resolvedTemplateId, sharedRelationshipTemplateId, sortRelationshipValues };
export type { RelationshipEntityValue };
