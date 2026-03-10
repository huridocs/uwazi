import { arrayBidirectionalDiff } from '../arrayBidirectionalDiff';

it('should return the added and deleted objects', () => {
  const a = [{ value: 1 }, { value: 3 }, { value: 2 }];
  const b = [{ value: 4 }, { value: 2 }, { value: 5 }];

  expect(
    arrayBidirectionalDiff(
      a,
      b,
      o => o.value,
      v => v
    )
  ).toEqual({
    added: [b[0], b[2]],
    removed: [a[0], a[1]],
  });
});
