import { ObjectId } from 'mongodb';

import { DbEdge } from '../DbEdge';

describe('DbEdge', () => {
  it('test test', async () => {
    DbEdge.prepare(DbEdge);

    const id1 = new ObjectId();
    const id2 = new ObjectId();
    const edge = new DbEdge({
      from: id1,
      to: id2,
    });
    console.log(edge);
  });
});
