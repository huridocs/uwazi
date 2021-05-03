/* eslint-disable no-await-in-loop */

export default {
  delta: 40,

  name: 'rename-usergroup-members_ref_id',

  description: 'rename user group member ref id',

  async up(db) {
    const cursor = await db.collection('usergroups').find({});

    while (await cursor.hasNext()) {
      const group = await cursor.next();
      const updatedMembers = group.members
        ? group.members.map(member => ({
            refId: member._id,
          }))
        : [];
      await db
        .collection('usergroups')
        .updateOne({ _id: group._id }, { $set: { members: updatedMembers } });
    }
    process.stdout.write(`${this.name}...\r\n`);
  },
};
