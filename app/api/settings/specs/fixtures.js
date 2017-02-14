import {db} from 'api/utils';

export default {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi'
    }
  ]
};
