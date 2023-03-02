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

  const contents = Array.from(new Set(selects.map(s => s.content)));
  const namesPerContent = Object.fromEntries(contents.map(c => [c, new Set()]));

  selects.forEach(s => {
    namesPerContent[s.content].add(s.name);
  });

  return Object.fromEntries(Object.entries(namesPerContent).map(([k, v]) => [k, Array.from(v)]));
};

// eslint-disable-next-line max-statements
const fixSelectsAndMultiSelects = async (db, idMap) => {
  const namesPerContent = Object.entries(await getSelectNamesPerContent(db));
  for (let i = 0; i < namesPerContent.length; i += 1) {
    const [thesaurusId, propertyNames] = namesPerContent[i];
    const idPairs = Object.entries(idMap[thesaurusId] || {});
    for (let j = 0; j < propertyNames.length; j += 1) {
      const propertyName = propertyNames[j];
      for (let k = 0; k < idPairs.length; k += 1) {
        const [oldId, newId] = idPairs[k];
        // eslint-disable-next-line no-await-in-loop
        await db
          .collection('entities')
          .updateMany(
            { [`metadata.${propertyName}.parent.id`]: oldId },
            { $set: { [`metadata.${propertyName}.$.parent.id`]: newId } }
          );
      }
    }
  }
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
