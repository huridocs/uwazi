import { Db } from 'mongodb';

export default {
  delta: 185,

  name: 'restore-text-markdown-empty-values',

  description:
    'Migration 184 incorrectly removed { value: "" } entries from text and markdown properties, ' +
    'which is not aligned with V1 behavior (V1 allows and preserves empty strings for these types). ' +
    'This migration restores all text/markdown properties that are currently [] back to [{ value: "" }].',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    // Collect all text/markdown property names across all templates
    const allTemplates = await db.collection('templates').find({}).toArray();

    const textOrMarkdownPropNames = new Set<string>();
    for (const template of allTemplates) {
      for (const prop of (template.properties as any[]) ?? []) {
        if (prop.type === 'text' || prop.type === 'markdown') {
          textOrMarkdownPropNames.add(prop.name);
        }
      }
    }

    if (textOrMarkdownPropNames.size === 0) {
      return;
    }

    // For every entity, for every text/markdown property whose value is [],
    // restore it to [{ value: '' }].
    const result = await db
      .collection('entities')
      .updateMany({ metadata: { $exists: true, $ne: null } }, [
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
                      $cond: {
                        if: {
                          $and: [
                            // Property is a text or markdown type
                            { $in: ['$$prop.k', Array.from(textOrMarkdownPropNames)] },
                            // Current value is an empty array
                            { $isArray: '$$prop.v' },
                            { $eq: [{ $size: '$$prop.v' }, 0] },
                          ],
                        },
                        then: [{ value: '' }],
                        else: '$$prop.v',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

    if (result.modifiedCount > 0) {
      this.reindex = true;
    }
  },
};
