import { Db } from 'mongodb';

export default {
  delta: 184,

  name: 'fix-metadata-integrity',

  description:
    'Removes metadata value entries where value is an empty string or null (empty values must ' +
    'be represented as [] not [{ value: "" }] or [{ value: null }]), and removes ghost ' +
    'thesaurus references from select/multiselect properties where the value id no longer ' +
    'exists in any dictionary.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    // Phase 1: remove entries where value is '' or null from all metadata properties
    const phase1Result = await db
      .collection('entities')
      .updateMany({ metadata: { $exists: true } }, [
        {
          $set: {
            metadata: {
              $arrayToObject: {
                $map: {
                  input: { $objectToArray: '$metadata' },
                  as: 'prop',
                  in: {
                    k: '$$prop.k',
                    v: {
                      $filter: {
                        input: '$$prop.v',
                        as: 'item',
                        cond: { $not: { $in: ['$$item.value', ['', null]] } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

    if (phase1Result.modifiedCount > 0) {
      this.reindex = true;
    }

    // Phase 2: remove ghost thesaurus references from select/multiselect properties
    // (value is a non-empty string that no longer exists in any dictionary)

    // Build set of select/multiselect property names across all templates
    const selectPropNames = new Set<string>();
    const allTemplates = await db.collection('templates').find({}).toArray();
    for (const template of allTemplates) {
      for (const prop of (template.properties as any[]) ?? []) {
        if (prop.type === 'select' || prop.type === 'multiselect') {
          selectPropNames.add(prop.name);
        }
      }
    }

    if (!selectPropNames.size) return;

    // Build set of all valid thesaurus value ids (top-level + nested children)
    const validIds = new Set<string>();
    const allDicts = await db.collection('dictionaries').find({}).toArray();
    for (const dict of allDicts) {
      for (const v of (dict.values as any[]) ?? []) {
        if (v.id) validIds.add(v.id);
        for (const child of (v.values as any[]) ?? []) {
          if (child.id) validIds.add(child.id);
        }
      }
    }

    const selectPropNamesArray = Array.from(selectPropNames);

    // Stream entities and filter out ghost refs
    const cursor = db.collection('entities').find({ metadata: { $exists: true } });

    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      let modified = false;
      const newMetadata: Record<string, unknown[]> = {};

      for (const [key, values] of Object.entries(
        (entity!.metadata as Record<string, any[]>) ?? {}
      )) {
        if (selectPropNamesArray.includes(key)) {
          const filtered = (values as any[]).filter(
            item => !item.value || validIds.has(item.value)
          );
          newMetadata[key] = filtered;
          if (filtered.length !== (values as any[]).length) modified = true;
        } else {
          newMetadata[key] = values as any[];
        }
      }

      if (modified) {
        await db
          .collection('entities')
          .updateOne({ _id: entity!._id }, { $set: { metadata: newMetadata } });
        this.reindex = true;
      }
    }
  },
};
