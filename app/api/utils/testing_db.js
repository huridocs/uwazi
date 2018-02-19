import pow from 'pow-mongodb-fixtures';
let db = pow.connect('mongodb://localhost/uwazi_testing');
db.id = (id) => {
  return pow.createObjectId(id);
};

export default db;
