import { isEmpty } from 'lodash';
import { ActivityLogGetRequest } from 'shared/types/activityLogApiTypes';
import moment from 'moment';
import { ParsedActions } from './activitylogParser';
import { EntryValue } from './activityLogBuilder';

type ActivityLogQuery = ActivityLogGetRequest['query'];

const prepareToFromRanges = (sanitizedTime: any) => {
  const fromDate = sanitizedTime.from && moment.unix(parseInt(sanitizedTime.from, 10));
  const toDate = sanitizedTime.to && moment.unix(parseInt(sanitizedTime.to, 10)).add(1, 'days');
  return {
    ...(fromDate && { $gte: fromDate }),
    ...(toDate && fromDate !== toDate && { $lte: toDate }),
    ...(toDate && fromDate === toDate && { $lt: toDate }),
  };
};

const parsedActionsEntries = Object.entries(ParsedActions);

const queryURL = (matchedEntries: [string, EntryValue][]) =>
  matchedEntries.map(([key]) => {
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
    const methods = this.query?.method;
    if (methods && methods.length > 0) {
      const queryMethods =
        methods.map(method =>
          ['CREATE', 'UPDATE'].includes(method.toUpperCase()) ? 'POST' : method.toUpperCase()
        ) || [];

      const matchedEntries = parsedActionsEntries.filter(
        ([key, value]) =>
          key.toUpperCase().match(`(${queryMethods.join('|')}).*`) &&
          value.method?.toUpperCase().match(`(${methods.join('|').toUpperCase()}).*`)
      );
      this.andQuery.push({ method: { $in: queryMethods } });
      if (matchedEntries.length > 0) {
        const orUrlItems = queryURL(matchedEntries);
        this.andQuery.push({ $or: orUrlItems });
      }
    }
  }

  endPointFilter() {
    if (this.query?.search === undefined) {
      return;
    }
    const matchedURLs = parsedActionsEntries.filter(([_key, value]) =>
      value.desc.toLowerCase().includes(this.query?.search?.toLocaleLowerCase() || '')
    );
    const orUrlItems = queryURL(matchedURLs);

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
