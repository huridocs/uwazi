const generateID = () => Math.random().toString(36).substr(2);

const generateNewIds = async db => {
  let reindex = false;
  const idMap = {};
  const dictionaries = ((await db.collection('dictionaries').find({}).toArray()) || []).filter(
    dict => dict.values
  );
  dictionaries.forEach(dict => {
    const groups = dict.values.filter(v => v.values);
    groups.forEach(group => {
      const groupId = group.id;
      const childIds = new Set(group.values.map(v => v.id));
      if (childIds.has(groupId)) {
        const newGroupId = generateID();
        idMap[groupId] = newGroupId;
        reindex = true;
      }
    });
  });
  return { idMap, reindex };
};

const updateGroupIds = async (db, idMap) => {
  const pairs = Object.entries(idMap);
  for (let i = 0; i < pairs.length; i += 1) {
    const [oldId, newId] = pairs[i];
    // eslint-disable-next-line no-await-in-loop
    await db
      .collection('dictionaries')
      .updateMany({ 'values.id': oldId }, { $set: { 'values.$.id': newId } });
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
  },
};
