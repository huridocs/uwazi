import { Db } from 'mongodb';

export default {
  delta: 184,

  name: 'fix-metadata-integrity',

  description:
    'Removes metadata value entries where value is an empty string or null (empty values must ' +
    'be represented as [] not [{ value: "" }] or [{ value: null }]); removes ghost thesaurus ' +
    'references from select/multiselect properties where the value id no longer exists in any ' +
    'dictionary; and normalizes daterange/multidaterange entries where from or to is missing ' +
    'by setting the absent field to null, or removes the entry if both are absent.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    // Phase 1: remove entries where value is '' or null from all metadata properties.
    // $ne: null guards against entities where metadata is explicitly null (not just absent).
    const phase1Result = await db
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
                      // $isArray guard: skip malformed properties whose value is not an array
                      $cond: {
                        if: { $isArray: '$$prop.v' },
                        then: {
                          $filter: {
                            input: '$$prop.v',
                            as: 'item',
                            cond: { $not: { $in: ['$$item.value', ['', null]] } },
                          },
                        },
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

    if (phase1Result.modifiedCount > 0) {
      this.reindex = true;
    }

    // Fetch all templates once — reused by phases 2 and 3
    const allTemplates = await db.collection('templates').find({}).toArray();

    // Phase 2: remove ghost thesaurus references from select/multiselect properties
    // (value is a non-empty string that no longer exists in any dictionary)

    const selectPropNames = new Set<string>();
    for (const template of allTemplates) {
      for (const prop of (template.properties as any[]) ?? []) {
        if (prop.type === 'select' || prop.type === 'multiselect') {
          selectPropNames.add(prop.name);
        }
      }
    }

    if (selectPropNames.size > 0) {
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

      const phase2Result = await db
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
                              { $isArray: '$$prop.v' },
                              { $in: ['$$prop.k', Array.from(selectPropNames)] },
                            ],
                          },
                          then: {
                            $filter: {
                              input: '$$prop.v',
                              as: 'item',
                              cond: { $in: ['$$item.value', Array.from(validIds)] },
                            },
                          },
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

      if (phase2Result.modifiedCount > 0) {
        this.reindex = true;
      }
    }

    // Phase 3: normalize daterange/multidaterange entries with missing from/to fields
    // - if only one of from/to is missing: set the absent field to null
    // - if both from and to are absent (neither is a number): remove the entry

    const dateRangePropNames: string[] = [];
    for (const template of allTemplates) {
      for (const prop of (template.properties as any[]) ?? []) {
        if (prop.type === 'daterange' || prop.type === 'multidaterange') {
          if (!dateRangePropNames.includes(prop.name)) {
            dateRangePropNames.push(prop.name);
          }
        }
      }
    }

    if (dateRangePropNames.length > 0) {
      const phase3Result = await db
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
                              { $isArray: '$$prop.v' },
                              { $in: ['$$prop.k', dateRangePropNames] },
                            ],
                          },
                          then: {
                            $map: {
                              input: {
                                // First: remove entries where both from and to are absent (missing keys)
                                $filter: {
                                  input: '$$prop.v',
                                  as: 'item',
                                  cond: {
                                    $not: {
                                      $and: [
                                        { $eq: [{ $type: '$$item.value.from' }, 'missing'] },
                                        { $eq: [{ $type: '$$item.value.to' }, 'missing'] },
                                      ],
                                    },
                                  },
                                },
                              },
                              as: 'item',
                              // Then: normalize surviving entries by filling absent fields with null
                              in: {
                                $mergeObjects: [
                                  '$$item',
                                  {
                                    value: {
                                      $mergeObjects: [{ from: null, to: null }, '$$item.value'],
                                    },
                                  },
                                ],
                              },
                            },
                          },
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

      if (phase3Result.modifiedCount > 0) {
        this.reindex = true;
      }
    }
  },
};
