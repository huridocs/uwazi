/* eslint-disable max-classes-per-file */
import { ObjectId } from 'mongodb';

import { Suggestions } from '#api/suggestions/suggestions.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import {
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
} from '#api/suggestions/blankSuggestions.js';
import { Subset } from '#shared/tsUtils.js';
import { ObjectIdSchema, PropertyTypeSchema } from '#shared/types/commonTypes.js';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { IXExtractorsDAOFactory } from './infrastructure/IXExtractorsDAOFactory.js';
import { IXErrorCode, IXValidationError } from './IXValidationError.js';

type AllowedPropertyTypes =
  | Subset<
      PropertyTypeSchema,
      'text' | 'numeric' | 'date' | 'select' | 'multiselect' | 'relationship' | 'markdown'
    >
  | 'title';

interface ExtractorType extends IXExtractorType {
  templates: string[];
}
interface NewExtractorType extends Omit<IXExtractorType, '_id'> {
  templates: string[];
}

const ALLOWED_PROPERTY_TYPES: AllowedPropertyTypes[] = [
  'title',
  'text',
  'numeric',
  'date',
  'select',
  'multiselect',
  'relationship',
  'markdown',
];

const allowedTypeSet = new Set<string>(ALLOWED_PROPERTY_TYPES);

const typeIsAllowed = (type: string): type is AllowedPropertyTypes => allowedTypeSet.has(type);

const checkTypeIsAllowed = (type: string) => {
  if (!typeIsAllowed(type)) {
    throw new IXValidationError(
      IXErrorCode.PROPERTY_TYPE_NOT_ALLOWED,
      `property type "${type}" is not allowed`
    );
  }
  return type;
};

const templatePropertyExistenceCheck = async (
  propertyName: string,
  templateIds: string[],
  role: 'property' | 'source property' = 'property'
) => {
  const tArray = await templates.get(templateIds);
  const usedTemplates = objectIndex(
    tArray,
    t => t._id.toString(),
    t => t
  );
  templateIds.forEach(id => {
    if (!(id in usedTemplates)) {
      throw new IXValidationError(IXErrorCode.TEMPLATE_MISSING, `template "${id}" does not exists`);
    }
  });

  if (propertyName === 'title') {
    return;
  }

  templateIds.forEach(id => {
    const property = usedTemplates[id].properties?.find(p => p.name === propertyName);

    if (!property) {
      throw new IXValidationError(
        IXErrorCode.PROPERTY_MISSING,
        `${role} "${propertyName}" does not exist in template "${id}"`
      );
    }

    checkTypeIsAllowed(property.type);
  });
};

/**
 * Only the target property used to be checked. An extractor could therefore be saved with a
 * source that can never produce text — a property missing from the templates, or a `source` that
 * is neither `pdf` nor `property`, which the route schema permits because it declares no
 * `required` inside `source`. The latter left the model stuck at `processing` (see the job's
 * `UntrainableExtractorSource`); this rejects it at the point the user can still fix it.
 */
const extractorValidityCheck = async ({
  source,
  property,
  templates: templateIds,
}: Pick<NewExtractorType, 'source' | 'property'> & { templates: string[] }) => {
  if (!templateIds.length) {
    throw new IXValidationError(
      IXErrorCode.TEMPLATES_REQUIRED,
      'an extractor must target at least one template'
    );
  }

  await templatePropertyExistenceCheck(property, templateIds);

  if (source.pdf) {
    return;
  }

  if (source.property) {
    await templatePropertyExistenceCheck(source.property, templateIds, 'source property');
    return;
  }

  throw new IXValidationError(
    IXErrorCode.SOURCE_REQUIRED,
    'an extractor source must be either a pdf or a property'
  );
};

const handlePropertyUpdate = async (updatedExtractor: IXExtractorType) => {
  await Suggestions.deleteByExtractorId(updatedExtractor._id);
  await createBlankSuggestionsForExtractor(updatedExtractor);
};

const handleTemplateUpdate = async (
  oldExtractor: IXExtractorType,
  newExtractor: IXExtractorType
) => {
  // Both sides are normalised to strings before diffing. `templates` reaches here as ObjectIds
  // on a plain array, so comparing an ObjectId against a string silently reports *every*
  // template as both removed and added — which deleted every suggestion and recreated it blank
  // on any update that left the templates alone, a rename included. Mongoose's arrays used to
  // cast on `includes`, which is why this only surfaced once the DAO replaced the model.
  const oldTemplateIds = oldExtractor.templates.map(templateId => templateId.toString());
  const newTemplateIds = newExtractor.templates.map(templateId => templateId.toString());

  const templatesRemoved = oldTemplateIds.filter(
    templateId => !newTemplateIds.includes(templateId)
  );
  const templatesAdded = newTemplateIds.filter(templateId => !oldTemplateIds.includes(templateId));

  if (templatesRemoved.length) {
    await Suggestions.deleteByTemplatesAndExtractors(templatesRemoved, [oldExtractor._id]);
  }

  if (templatesAdded.length) {
    await createBlankSuggestionsForPartialExtractor(newExtractor, templatesAdded);
  }
};

class MissingExtractorError extends DomainError {
  constructor() {
    super('Missing extractor.', 'MissingExtractorError');
  }
}

const dao = () => IXExtractorsDAOFactory.default();

const Extractors = {
  getById: async (id: ObjectIdSchema) => dao().getById(id),
  getByTemplate: async (templateId: ObjectIdSchema) => dao().getByTemplate(templateId),
  getPropertySourceExtractorsForTemplate: async (templateId: ObjectIdSchema) =>
    dao().getPropertySourceExtractorsForTemplate(templateId),
  getPdfSourceExtractorsForTemplate: async (templateId: ObjectIdSchema) =>
    dao().getPdfSourceExtractorsForTemplate(templateId),
  get_all: async () => dao().getAll(),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await dao().getByIds(ids);
    if (extractors.length !== ids.length) throw new MissingExtractorError();
    await dao().deleteByIds(ids);
    await Suggestions.deleteByExtractorIds(ids);
  },
  create: async (extractor: NewExtractorType) => {
    const { name, source, property, templates: templateIds } = extractor;
    await extractorValidityCheck({ source, property, templates: templateIds });
    const saved = await dao().create({
      name,
      source,
      property,
      templates: templateIds,
    });
    await createBlankSuggestionsForExtractor(saved);
    return saved;
  },
  update: async (extractor: ExtractorType) => {
    const { _id, name, source, property, templates: templateIds } = extractor;
    const curentExtractor = await dao().getById(_id);
    if (!curentExtractor) throw new MissingExtractorError();
    await extractorValidityCheck({ source, property, templates: templateIds });

    const updated = await dao().update({
      ...curentExtractor,
      name,
      source,
      property,
      templates: templateIds,
    });

    if (property !== curentExtractor.property) {
      await handlePropertyUpdate(updated);
    } else {
      await handleTemplateUpdate(curentExtractor, updated);
    }

    return updated;
  },

  cleanupTemplateFromPropertyExtractors: async (
    templateId: string,
    propertyNamesToKeep: string[]
  ) => {
    const extractorsToUpdate = await dao().getByTemplateExcludingProperties(
      templateId,
      propertyNamesToKeep
    );

    const extractorIds = extractorsToUpdate.map(extractor => extractor._id);

    await dao().removeTemplateFromExtractors(extractorIds, templateId);

    await Suggestions.deleteByTemplatesAndExtractors([templateId], extractorIds);
    await dao().deleteEmptyByIds(extractorIds);
  },
};

class ExtractorNotFound extends Error {
  constructor(extractorId: string) {
    super(`Extractor with ID ${extractorId} not found.`);
  }
}

class ModelNotReadyError extends Error {
  constructor(extractorId: string) {
    super(`Model for extractor with ID ${extractorId} is not ready.`);
  }
}

export type { AllowedPropertyTypes };
export {
  ALLOWED_PROPERTY_TYPES,
  typeIsAllowed,
  checkTypeIsAllowed,
  ExtractorNotFound,
  ModelNotReadyError,
  Extractors,
};
