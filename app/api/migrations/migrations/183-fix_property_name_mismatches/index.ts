/* eslint-disable no-await-in-loop, import/no-default-export */
import { Db, ObjectId } from 'mongodb';
import { PropertyChange, Template, Property, Settings } from './types.js';

// Safe name generation function - matches the new generation algorithm
// From: app/api/core/domain/template/utils/propertyNameGeneration.ts
const generateNewSafeName = (label: string): string => {
  if (!label || typeof label !== 'string') {
    return '';
  }

  return label
    .trim()
    .replace(/[# \\ / | * ? " < > = \s : . [ \] % ! \- & ^ + ( ) { } [ \] ~]/gi, '_')
    .replace(/^[ _ \- + $]/, '')
    .toLowerCase();
};

export default {
  delta: 183,

  name: 'fix_property_name_mismatches',

  description:
    'Fix property names in templates and entity metadata that do not match their labels using new safeName generation',

  reindex: false,

  generateExpectedName(property: Property): string {
    const safeName = generateNewSafeName(property.label);

    if (property.type === 'geolocation' || property.type === 'nested') {
      return `${safeName}_${property.type}`;
    }

    return safeName;
  },

  analyzeTemplate(template: Template): PropertyChange[] {
    const changes: PropertyChange[] = [];

    if (template.properties) {
      template.properties.forEach(property => {
        if (property.label && property.name) {
          const expectedName = this.generateExpectedName(property);

          if (property.name !== expectedName) {
            changes.push({
              oldName: property.name,
              newName: expectedName,
              label: property.label,
              type: property.type,
            });
          }
        }
      });
    }

    return changes;
  },

  async updateTemplate(db: Db, templateId: ObjectId, changes: PropertyChange[]): Promise<void> {
    const template = await db.collection<Template>('templates').findOne({ _id: templateId });

    if (!template) {
      return;
    }

    const changeMap = new Map(changes.map(c => [c.oldName, c.newName]));

    const updatedProperties = template.properties?.map(prop => {
      const newName = changeMap.get(prop.name);
      return newName ? { ...prop, name: newName } : prop;
    });

    await db.collection('templates').updateOne(
      { _id: templateId },
      {
        $set: {
          properties: updatedProperties,
        },
      }
    );
  },

  async updateEntitiesForTemplate(
    db: Db,
    templateId: ObjectId,
    changes: PropertyChange[]
  ): Promise<number> {
    const renameOps: Record<string, string> = {};

    changes.forEach(change => {
      renameOps[`metadata.${change.oldName}`] = `metadata.${change.newName}`;
    });

    const result = await db
      .collection('entities')
      .updateMany({ template: templateId }, { $rename: renameOps });

    if (result.modifiedCount > 0) {
      process.stdout.write(`  Updated ${result.modifiedCount} entities\n`);
    }

    return result.modifiedCount;
  },

  async up(db: Db): Promise<boolean> {
    process.stdout.write(`${this.name}...\r\n`);

    process.stdout.write('Checking newNameGeneration setting...\n');
    const settings = await db.collection<Settings>('settings').findOne({});
    if (!settings?.newNameGeneration) {
      process.stdout.write('Skipping: newNameGeneration not enabled\n');
      this.reindex = false;
      return this.reindex;
    }

    const templates = await db.collection<Template>('templates').find({}).toArray();
    const propertyNameChanges = new Map<string, PropertyChange[]>();

    for (const template of templates) {
      const changes = this.analyzeTemplate(template);
      if (changes.length > 0) {
        propertyNameChanges.set(template._id.toString(), changes);
      }
    }

    if (propertyNameChanges.size === 0) {
      process.stdout.write('No property name mismatches found.\n');
      this.reindex = false;
      return this.reindex;
    }

    // Update templates using bulkWrite
    process.stdout.write('\nUpdating templates...\n');
    const templateMap = new Map(templates.map(t => [t._id.toString(), t]));
    const bulkOps = Array.from(propertyNameChanges.entries())
      .map(([templateId, changes]) => {
        const template = templateMap.get(templateId);
        if (!template) {
          return null;
        }

        const changeMap = new Map(changes.map(c => [c.oldName, c.newName]));
        const updatedProperties = template.properties?.map(prop => {
          const newName = changeMap.get(prop.name);
          return newName ? { ...prop, name: newName } : prop;
        });

        return {
          updateOne: {
            filter: { _id: new ObjectId(templateId) },
            update: {
              $set: {
                properties: updatedProperties,
              },
            },
          },
        };
      })
      .filter(op => op !== null);

    if (bulkOps.length > 0) {
      await db.collection('templates').bulkWrite(bulkOps as any);
      process.stdout.write(`  Updated ${bulkOps.length} template(s)\n`);
    }

    // Update entities for each affected template
    process.stdout.write('\nUpdating entities...\n');
    let totalEntitiesUpdated = 0;
    for (const [templateId, changes] of propertyNameChanges.entries()) {
      const count = await this.updateEntitiesForTemplate(db, new ObjectId(templateId), changes);
      totalEntitiesUpdated += count;
    }

    process.stdout.write('\nMigration complete:\n');
    process.stdout.write(`  - ${propertyNameChanges.size} template(s) fixed\n`);
    process.stdout.write(`  - ${totalEntitiesUpdated} entity/entities updated\n`);

    this.reindex = true;
    return this.reindex;
  },
};
