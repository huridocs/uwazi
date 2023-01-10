import templates from 'api/templates';
import { ObjectId } from 'mongodb';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { IXExtractorModel as model } from './IXExtractorModel';

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
  get_all: async () => model.get({}),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await model.get({ _id: { $in: ids } });
    if (extractors.length !== ids.length) throw new Error('Missing extractor.');
    await model.delete({ _id: { $in: ids } });
  },
  create: async (name: string, property: string, templateIds: string[]) => {
    await templatePropertyExistenceCheck(property, templateIds);
    const saved = await model.save({
      name,
      property,
      templates: templateIds,
    });
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
    return updated;
  },
};
