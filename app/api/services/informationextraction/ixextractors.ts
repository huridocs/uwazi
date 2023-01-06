import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { IXExtractorModel as model } from './IXExtractorModel';

const generateExtractorId = () => `${Date.now()}${Math.random().toString(36)}`;

const templatePropertyExistenceCheck = async (property: string, templateIds: string[]) => {
  const usedTemplates = objectIndex(
    await templates.get({ _id: { $in: templateIds } }),
    t => t._id.toString(),
    t => t
  );
  templateIds.forEach(id => {
    if (!(id in usedTemplates)) {
      throw Error('Missing template.');
    }
  });

  const propertyMap = Object.fromEntries(
    Object.entries(usedTemplates).map(([tId, t]) => [
      tId,
      new Set(t.properties?.map(p => p.name) || []),
    ])
  );
  templateIds.forEach(id => {
    if (!propertyMap[id].has(property)) {
      throw Error('Missing property.');
    }
  });
};

export default {
  get: model.get.bind(model),
  delete: async (extractorIds: string[]) => {
    const extractors = await model.get({ extractorId: { $in: extractorIds } });
    if (extractors.length !== extractorIds.length) throw new Error('Missing extractor.');
    await model.delete({ extractorId: { $in: extractorIds } });
  },
  create: async (name: string, property: string, templateIds: string[]) => {
    await templatePropertyExistenceCheck(property, templateIds);
    const saved = await model.save({
      extractorId: generateExtractorId(),
      name,
      property,
      templates: templateIds,
    });
    return saved;
  },
  update: async (extractorId: string, name: string, property: string, templateIds: string[]) => {
    const [extractor] = await model.get({ extractorId });
    if (!extractor) throw Error('Missing extractor.');

    await templatePropertyExistenceCheck(property, templateIds);

    const updated = await model.save({
      ...extractor,
      name,
      property,
      templates: templateIds,
    });
    return updated;
  },
};
