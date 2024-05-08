import { isEmpty, uniq } from 'lodash';
import { ActivityLogGetRequest } from 'shared/types/activityLogApiTypes';
import { ParsedActions } from './activitylogParser';

const prepareToFromRanges = (sanitizedTime: any) => {
  const time: { $gte?: number; $lte?: number } = {};

  if (sanitizedTime.from) {
    time.$gte = parseInt(sanitizedTime.from, 10) * 1000;
  }

  if (sanitizedTime.to) {
    time.$lte = parseInt(sanitizedTime.to, 10) * 1000;
  }

  return time;
};

const timeQuery = ({ time, before = -1 }: ActivityLogGetRequest['query']) => {
  const sanitizedTime = Object.keys(time).reduce(
    (memo, k) => (time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo),
    {}
  );

  if (before === -1 && !Object.keys(sanitizedTime).length) {
    return {};
  }

  const result = { time: prepareToFromRanges(sanitizedTime) };

  if (before !== -1) {
    result.time.$lt = before;
  }

  return result;
};

class ActivityLogFilter {
  andQuery: {}[] = [];

  searchQuery: {}[] = [];

  query: ActivityLogGetRequest['query'];

  constructor(requestQuery: ActivityLogGetRequest['query']) {
    this.query = requestQuery;
  }

  setRequestFilter(property: 'url' | 'query' | 'body' | 'params', exact = false) {
    if (this.query?.[property] !== undefined) {
      const exp = this.query?.[property]!.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&');

      this.andQuery.push({
        [property]: {
          $regex: exact ? `^${exp}$` : exp,
        },
      });
    }
  }

  prepareRegexpQueries = () => {
    this.setRequestFilter('url', true);
    this.setRequestFilter('query');
    this.setRequestFilter('body');
    this.setRequestFilter('params');
  };

  searchFilter() {
    if (this.query?.search) {
      const regex = { $regex: `.*${this.query?.search}.*`, $options: 'si' };
      this.searchQuery.push({
        $or: [
          { method: regex },
          { url: { $regex: `^${this.query?.search.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}$` } },
          { query: regex },
          { body: regex },
          { params: regex },
        ],
      });
    }
  }

  // eslint-disable-next-line max-statements
  endPointFilter() {
    if (this.query?.search === undefined && this.query?.method === undefined) {
      return;
    }
    const queryMethods = this.query?.method?.map(method => method.toUpperCase()) || [];
    const parsedActionsEntries = Object.entries(ParsedActions);
    const matchedURLs = parsedActionsEntries.filter(([_key, value]) =>
      value.desc.toLowerCase().includes(this.query?.search?.toLocaleLowerCase() || '')
    );
    const matchedMethods = parsedActionsEntries.filter(
      ([_key, value]) =>
        this.query?.method?.length === 0 || queryMethods.includes(value.method || '')
    );
    const orUrlItems = matchedURLs.map(([key]) => {
      const entries = key.split(/\/(.*)/s);
      return {
        $and: [
          {
            url: {
              $regex: `^\\/${entries[1].replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}$`,
            },
          },
          {
            method: entries[0],
          },
        ],
      };
    });
    this.searchFilter();
    if (orUrlItems.length > 0) {
      this.searchQuery.push({ $or: orUrlItems });
    }
    if (this.searchQuery.length > 0) {
      this.andQuery.push({ $or: this.searchQuery });
    }
    const matchedHttpMethods = uniq(matchedMethods.map(([key]) => key.split(/\/(.*)/s)[0]));
    if (matchedHttpMethods.length > 0 || queryMethods.length > 0) {
      this.andQuery.push({
        $or: [
          ...(matchedHttpMethods.length > 0 ? [{ method: { $in: matchedHttpMethods } }] : []),
          ...(queryMethods.length > 0 ? [{ method: { $in: queryMethods } }] : []),
        ],
      });
    }
  }

  findFilter() {
    if (this.query?.find) {
      const regex = { $regex: `.*${this.query?.find}.*`, $options: 'si' };
      this.andQuery.push({
        $or: [
          { method: regex },
          { url: regex },
          { query: regex },
          { body: regex },
          { params: regex },
        ],
      });
    }
  }

  timeFilter() {
    if (this.query?.time) {
      this.andQuery.push(timeQuery(this.query));
    }
  }

  userFilter() {
    if (this.query?.username) {
      const orUser: {}[] = [
        { username: { $regex: `.*${this.query?.username}.*`, $options: 'si' } },
      ];
      if (this.query.username === 'anonymous') {
        orUser.push({ username: null });
      }
      this.andQuery.push({ $or: orUser });
    }
  }

  prepareQuery() {
    this.prepareRegexpQueries();
    this.endPointFilter();
    this.findFilter();
    this.userFilter();
    this.timeFilter();
    return !isEmpty(this.andQuery) ? { $and: this.andQuery } : {};
  }
}

export { ActivityLogFilter };
