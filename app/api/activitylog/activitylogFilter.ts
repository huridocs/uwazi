import { isEmpty } from 'lodash';
import { ActivityLogGetRequest } from 'shared/types/activityLogApiTypes';
import { ParsedActions } from './activitylogParser';

type ActivityLogQuery = ActivityLogGetRequest['query'];

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

class ActivityLogFilter {
  andQuery: {}[] = [];

  searchQuery: {}[] = [];

  query: ActivityLogQuery;

  constructor(requestQuery: ActivityLogQuery) {
    this.query = requestQuery;
  }

  timeQuery() {
    const time = this.query?.time || {};
    const before = this.query?.before || -1;

    const sanitizedTime = Object.keys(time).reduce(
      (memo, k) => (time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo),
      {}
    );

    if (before === -1 && isEmpty(sanitizedTime)) {
      return;
    }

    const timeFilter = {
      ...(!isEmpty(sanitizedTime) ? { time: prepareToFromRanges(sanitizedTime) } : {}),
      ...(before !== -1 ? { time: { $lt: before } } : {}),
    };

    this.andQuery.push(timeFilter);
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

  methodFilter() {
    if (this.query?.method && this.query?.method.length > 0) {
      const queryMethods = this.query?.method?.map(method => method.toUpperCase()) || [];
      this.andQuery.push({ method: { $in: queryMethods } });
    }
  }

  endPointFilter() {
    if (this.query?.search === undefined) {
      return;
    }
    const parsedActionsEntries = Object.entries(ParsedActions);
    const matchedURLs = parsedActionsEntries.filter(([_key, value]) =>
      value.desc.toLowerCase().includes(this.query?.search?.toLocaleLowerCase() || '')
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
    this.methodFilter();
    this.endPointFilter();
    this.findFilter();
    this.userFilter();
    this.timeQuery();
    return !isEmpty(this.andQuery) ? { $and: this.andQuery } : {};
  }
}

export { ActivityLogFilter };
