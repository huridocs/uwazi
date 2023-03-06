const generateID = () => Math.random().toString(36).substr(2);

const generateNewIds = async db => {
  let reindex = false;
  const idMap = {};
  const dictionaries = ((await db.collection('dictionaries').find({}).toArray()) || []).filter(
    dict => dict.values
  );
  dictionaries.forEach(dict => {
    const idMapForThesaurus = {};
    const groups = dict.values.filter(v => v.values);
    groups.forEach(group => {
      const groupId = group.id;
      const childIds = new Set(group.values.map(v => v.id));
      if (childIds.has(groupId)) {
        const newGroupId = generateID();
        idMapForThesaurus[groupId] = newGroupId;
        reindex = true;
      }
      idMap[dict._id.toString()] = idMapForThesaurus;
    });
  });
  return { idMap, reindex };
};

const updateGroupIds = async (db, idMap) => {
  const flatIdMap = Object.fromEntries(
    Object.values(idMap)
      .map(v => Object.entries(v))
      .flat()
  );
  const pairs = Object.entries(flatIdMap);
  for (let i = 0; i < pairs.length; i += 1) {
    const [oldId, newId] = pairs[i];
    // eslint-disable-next-line no-await-in-loop
    await db
      .collection('dictionaries')
      .updateMany({ 'values.id': oldId }, { $set: { 'values.$.id': newId } });
  }
};

const selectTypes = new Set(['select', 'multiselect']);

const getSelectNamesPerContent = async db => {
  const templates = await db.collection('templates').find({}).toArray();
  const properties = templates.map(t => t.properties || []).flat();
  const selects = properties.filter(p => selectTypes.has(p.type));
  const inheriting = properties.filter(p => selectTypes.has(p.inherit?.type));

  const namesPerContent = {};

  selects.forEach(s => {
    if (!namesPerContent[s.content]) {
      namesPerContent[s.content] = new Set();
    }
    namesPerContent[s.content].add({ propertyName: s.name, inheriting: false });
  });

  inheriting.forEach(i => {
    const inheritedProperty = properties.find(
      property => property._id.toString() === i.inherit.property
    );
    if (inheritedProperty) {
      if (!namesPerContent[inheritedProperty.content]) {
        namesPerContent[inheritedProperty.content] = new Set();
      }
      namesPerContent[inheritedProperty.content].add({ propertyName: i.name, inheriting: true });
    }
  });

  return Object.fromEntries(Object.entries(namesPerContent).map(([k, v]) => [k, Array.from(v)]));
};

const fixSelectsAndMultiSelects = async (db, idMap) => {
  const thesauriToUpdateIds = Object.keys(idMap);
  if (!thesauriToUpdateIds.length) return;
  const thesauriToPropertyNameMap = await getSelectNamesPerContent(db);
  await Promise.all(
    thesauriToUpdateIds.map(async thesauriId => {
      await Promise.all(
        (thesauriToPropertyNameMap[thesauriId] || []).map(async ({ propertyName, inheriting }) => {
          const groupsToUpdateIds = Object.keys(idMap[thesauriId]);
          await Promise.all(
            groupsToUpdateIds.map(async oldGroupId => {
              const newId = idMap[thesauriId][oldGroupId];
              if (!inheriting) {
                await db
                  .collection('entities')
                  .updateMany(
                    { [`metadata.${propertyName}.parent.value`]: oldGroupId },
                    { $set: { [`metadata.${propertyName}.$[valueIndex].parent.value`]: newId } },
                    { arrayFilters: [{ 'valueIndex.parent.value': oldGroupId }] }
                  );
              } else {
                await db.collection('entities').updateMany(
                  { [`metadata.${propertyName}.inheritedValue.parent.value`]: oldGroupId },
                  {
                    $set: {
                      [`metadata.${propertyName}.$[].inheritedValue.$[valueIndex].parent.value`]:
                        newId,
                    },
                  },
                  { arrayFilters: [{ 'valueIndex.parent.value': oldGroupId }] }
                );
              }
            })
          );
        })
      );
    })
  );
};

export default {
  delta: 125,

  name: 'thesaurus_group_child_id_fix',

  description:
    'Regenerates the parent id in thesauri groups, if an element in the group has the same id. Denormalizes it in entities.',

  reindex: undefined,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const { idMap, reindex } = await generateNewIds(db);

    this.reindex = reindex;

    await updateGroupIds(db, idMap);
    await fixSelectsAndMultiSelects(db, idMap);
  },
};
