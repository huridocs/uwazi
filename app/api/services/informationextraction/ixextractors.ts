import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { IXExtractorModel as model } from './IXExtractorModel';

const generateExtractorId = () => `${Date.now()}${Math.random().toString(36)}`;

const existenceCheck = async (property: string, templateIds: string[]) => {
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
  delete: model.delete.bind(model),
  create: async (name: string, property: string, templateIds: string[]) => {
    await existenceCheck(property, templateIds);
    const saved = await model.save({
      extractorId: generateExtractorId(),
      name,
      property,
      templates: templateIds,
    });
    return saved;
  },
};
