import qs from 'qs';
import { searchResultTotal } from '../index.js';

const lastLink = (limit: number, offset: number) =>
  `/api/v2/search?${qs.stringify({ page: { limit, offset } })}`;

describe('searchResultTotal', () => {
  it('reads the total from the last pagination link', () => {
    expect(searchResultTotal({ last: lastLink(200, 130) }, 200)).toBe(330);
  });

  it('uses the row count when the page already holds every match', () => {
    expect(searchResultTotal({ last: lastLink(200, -160) }, 40)).toBe(40);
  });

  it('falls back to the row count when there is no last link', () => {
    expect(searchResultTotal(undefined, 3)).toBe(3);
  });
});
