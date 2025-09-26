import { Db, ObjectId } from 'mongodb';
import { PropertySchema, TemplateSchema } from './types';

const required: Omit<PropertySchema, '_id'>[] = [
  { label: 'Title', name: 'title', type: 'text', isCommonProperty: true },
  { label: 'Date added', name: 'creationDate', type: 'date', isCommonProperty: true },
  { label: 'Date modified', name: 'editDate', type: 'date', isCommonProperty: true },
];

const priority: Record<string, number> = {
  title: 0,
  creationDate: 1,
  editDate: 2,
};

const fixPropertyName = (name: string) => {
  if (name === 'date_added') return 'creationDate';
  if (name === 'date_modified') return 'editDate';

  return name;
};

export default {
  delta: 177,

  name: 'Ensure Common Properties',

  description:
    'Ensure Common Properties are present in every Template and fix Property name inconsistency',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const templatesColl = db.collection<TemplateSchema>('templates');

    const templatesAffected = await templatesColl
      .find({
        $or: [
          { commonProperties: { $not: { $elemMatch: { name: 'title' } } } },
          { commonProperties: { $not: { $elemMatch: { name: 'creationDate' } } } },
          { commonProperties: { $not: { $elemMatch: { name: 'editDate' } } } },
        ],
      })
      .toArray();

    const ensureCommonProperties = (commonProperties: PropertySchema[]) => {
      const fixed: PropertySchema[] = commonProperties.map(p => ({
        ...p,
        name: fixPropertyName(p.name),
        isCommonProperty: true,
      }));

      required.forEach(
        prop =>
          !fixed.some(p => p.name === prop.name) && fixed.push({ _id: new ObjectId(), ...prop })
      );

      fixed.sort((a, b) => priority[a.name] - priority[b.name]);

      return fixed;
    };

    if (templatesAffected.length === 0) {
      process.stdout.write('No templates missing common properties.\r\n');
      return;
    }

    const bulkOps = templatesAffected.map(template => ({
      updateOne: {
        filter: { _id: template._id },
        update: {
          $set: {
            commonProperties: ensureCommonProperties(template.commonProperties || []),
            __v: Number(template.__v || 0) + 1,
          },
        },
      },
    }));

    await templatesColl.bulkWrite(bulkOps as any);

    process.stdout.write(
      `✅ Updated ${templatesAffected.length} templates to ensure common properties.\r\n`
    );
  },
};
