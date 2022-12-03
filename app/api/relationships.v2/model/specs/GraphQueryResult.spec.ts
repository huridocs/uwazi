import { GraphQueryResult } from '../GraphQueryResult';

const path = [
  { _id: 'id1', sharedId: 'shared1', title: 'title1' },
  { _id: 'id2', type: 'type2' },
  { _id: 'id3', sharedId: 'shared3', title: 'title3' },
  { _id: 'id4', type: 'type4' },
  { _id: 'id5', sharedId: 'shared5', title: 'title4' },
] as const;

const result = new GraphQueryResult([path[1], path[3]], [path[0], path[2], path[4]]);

describe('when calling leaf()', () => {
  it('should return the entity at the end of the path', () => {
    expect(result.leaf()).toBe(path[4]);
  });
});
