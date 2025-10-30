/* eslint-disable max-classes-per-file */
import { ObjectId } from 'mongodb';

import { Suggestions } from 'api/suggestions/suggestions';
import templates from 'api/core/v1_layer/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { IXExtractorType } from 'shared/types/extractorType';
import {
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
} from 'api/suggestions/blankSuggestions';
import { Subset } from 'shared/tsUtils';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { IXExtractorModel as model } from './IXExtractorModel';
import { IXErrorCode, IXValidationError } from './IXValidationError';

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

const templatePropertyExistenceCheck = async (propertyName: string, templateIds: string[]) => {
  const tArray = await templates.get({ _id: { $in: templateIds } });
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
        `property "${propertyName}" does not exist in template "${id}"`
      );
    }

    checkTypeIsAllowed(property.type);
  });
};

const handlePropertyUpdate = async (updatedExtractor: IXExtractorType) => {
  await Suggestions.delete({ extractorId: updatedExtractor._id });
  await createBlankSuggestionsForExtractor(updatedExtractor);
};

const handleTemplateUpdate = async (
  oldExtractor: IXExtractorType,
  newExtractor: IXExtractorType
) => {
  const templatesRemoved = oldExtractor.templates
    .filter(templateId => !newExtractor.templates.includes(templateId.toString()))
    .map(templateId => templateId.toString());

  const templatesAdded = newExtractor.templates.filter(
    templateId => !oldExtractor.templates.find(template => template.toString() === templateId)
  );

  await Suggestions.delete({
    entityTemplate: { $in: templatesRemoved },
    extractorId: oldExtractor._id,
  });

  if (templatesAdded.length) {
    await createBlankSuggestionsForPartialExtractor(newExtractor, templatesAdded);
  }
};

const Extractors = {
  get: model.get.bind(model),
  getById: model.getById.bind(model),
  get_all: async () => model.get({}),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await model.get({ _id: { $in: ids } });
    if (extractors.length !== ids.length) throw new Error('Missing extractor.');
    await model.delete({ _id: { $in: ids } });
    await Suggestions.delete({ extractorId: { $in: ids } });
  },
  create: async (extractor: NewExtractorType) => {
    const { name, source, property, templates: templateIds } = extractor;
    await templatePropertyExistenceCheck(property, templateIds);
    const saved = await model.save({
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
    const [curentExtractor] = await model.get({ _id });
    if (!curentExtractor) throw Error('Missing extractor.');
    await templatePropertyExistenceCheck(property, templateIds);

    const updated = await model.save({
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
    const extractorsToUpdate = await model.get({
      templates: templateId,
      property: { $nin: propertyNamesToKeep },
    });

    const extractorIds = extractorsToUpdate.map(extractor => extractor._id);

    await model.updateMany({ _id: { $in: extractorIds } }, { $pull: { templates: templateId } });

    await Suggestions.delete({ entityTemplate: templateId, extractorId: { $in: extractorIds } });
    await model.delete({ _id: { $in: extractorIds }, templates: { $size: 0 } });
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
