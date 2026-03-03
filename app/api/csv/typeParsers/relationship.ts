import entities from '#api/entities/index.js';
import { unique, emptyString } from '#api/utils/filters.js';
import { RawEntity } from '#api/csv/entityRow.js';
import { ensure } from '#shared/tsUtils.js';
import { PropertySchema, MetadataObjectSchema } from '#shared/types/commonTypes.js';
import { EntityWithFilesSchema } from '#shared/types/entityType.js';
import { csvConstants } from '../csvDefinitions.js';
import { sanitizeMetadataValue, SanitizationWarning } from '../sanitizationUtils.js';

export interface ParserResult {
  data: MetadataObjectSchema[];
  warnings: SanitizationWarning[];
}

const relationship = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const sanitizationResult = sanitizeMetadataValue(
    rawValue,
    ensure<string>(property.name),
    property.type
  );

  if (sanitizationResult.value === '') {
    return {
      data: [],
      warnings: sanitizationResult.warnings,
    };
  }

  const values = sanitizationResult.value
    .split(csvConstants.multiValueSeparator)
    .filter(emptyString)
    .filter(unique);

  // On newer mongoose versions, replace "any" with "FilterQuery"
  const query: any = { title: { $in: values } };

  if (property.content) {
    query.template = property.content;
  }

  const current: EntityWithFilesSchema[] = await entities.get(query);
  const newValues = values.filter(v => !current.map(c => c.title).includes(v));

  if (property.content) {
    await newValues.reduce(async (promise: Promise<any>, title) => {
      await promise;
      return entities.save(
        {
          title,
          template: property.content,
        },
        {
          language: entityToImport.language,
          user: {},
        }
      );
    }, Promise.resolve([]));
  }

  const toRelateEntities: EntityWithFilesSchema[] = await entities.get(query);
  return {
    data: toRelateEntities
      .map(e => ({ value: e.sharedId, label: e.title }))
      .filter(
        (mo, index, mos) => mos.findIndex(e => e.value === mo.value) === index
      ) as MetadataObjectSchema[],
    warnings: sanitizationResult.warnings,
  };
};

export default relationship;
