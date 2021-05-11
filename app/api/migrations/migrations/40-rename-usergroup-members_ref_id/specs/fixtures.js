import db from 'api/utils/testing_db';

export default {
  usergroups: [
    { _id: db.id(), name: 'Group 1' },
    { _id: db.id(), name: 'Group 2', members: [{ _id: 'user1' }] },
    { _id: db.id(), name: 'Group 3', members: [{ _id: 'user1' }, { _id: 'user2' }] },
    { _id: db.id(), name: 'Group 4', members: [] },
  ],
};
