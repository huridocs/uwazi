import { ObjectId } from 'mongodb';

import { Suggestions } from 'api/suggestions/suggestions';
import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { IXExtractorType } from 'shared/types/extractorType';
import {
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
} from 'api/suggestions/blankSuggestions';
import { propertyTypes } from 'shared/propertyTypes';
import { IXExtractorModel as model } from './IXExtractorModel';

const ALLOWED_PROPERTY_TYPES: (typeof propertyTypes)[keyof typeof propertyTypes][] = [
  'text',
  'numeric',
  'date',
  'select',
  'multiselect',
];

const templatePropertyExistenceCheck = async (propertyName: string, templateIds: string[]) => {
  const tArray = await templates.get({ _id: { $in: templateIds } });
  const usedTemplates = objectIndex(
    tArray,
    t => t._id.toString(),
    t => t
  );
  templateIds.forEach(id => {
    if (!(id in usedTemplates)) {
      throw Error('Missing template.');
    }
  });

  if (propertyName === 'title') {
    return;
  }

  templateIds.forEach(id => {
    const property = usedTemplates[id].properties?.find(p => p.name === propertyName);

    if (!property) {
      throw new Error('Missing property.');
    }

    if (!ALLOWED_PROPERTY_TYPES.includes(property.type)) {
      throw new Error('Property type not allowed.');
    }
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

export const Extractors = {
  get: model.get.bind(model),
  get_all: async () => model.get({}),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await model.get({ _id: { $in: ids } });
    if (extractors.length !== ids.length) throw new Error('Missing extractor.');
    await model.delete({ _id: { $in: ids } });
    await Suggestions.delete({ extractorId: { $in: ids } });
  },
  create: async (name: string, property: string, templateIds: string[]) => {
    await templatePropertyExistenceCheck(property, templateIds);
    const saved = await model.save({
      name,
      property,
      templates: templateIds,
    });
    await createBlankSuggestionsForExtractor(saved);
    return saved;
  },
  update: async (id: string, name: string, property: string, templateIds: string[]) => {
    const [extractor] = await model.get({ _id: new ObjectId(id) });
    if (!extractor) throw Error('Missing extractor.');
    await templatePropertyExistenceCheck(property, templateIds);

    const updated = await model.save({
      ...extractor,
      name,
      property,
      templates: templateIds,
    });

    if (property !== extractor.property) {
      await handlePropertyUpdate(updated);
    } else {
      await handleTemplateUpdate(extractor, updated);
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
  },
};
