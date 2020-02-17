import db from 'api/utils/testing_db';

const search1Id = db.id();
const search2Id = db.id();
const search3Id = db.id();
const search4Id = db.id();

export default {
  semanticsearches: [
    { _id: search1Id, status: 'inProgress' },
    { _id: search2Id, status: 'inProgress' },
    { _id: search3Id, status: 'pending' },
    { _id: db.id(), status: 'completed' },
    { _id: search4Id, status: 'inProgress' },
  ],
};

export { search1Id, search2Id, search3Id, search4Id };
