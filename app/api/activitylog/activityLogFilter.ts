import { isEmpty } from 'lodash';
import moment from 'moment';
import { ActivityLogGetRequest } from 'shared/types/activityLogApiTypes';
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
    const condition: { $and: {}[] } = {
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
    return condition;
  });

const andCondition = (method: string, regex: string, property: string = 'body') => ({
  $and: [
    {
      method,
    },
    {
      [property]: {
        $regex: regex,
      },
    },
  ],
});

const bodyCondition = (methods: string[]) => {
  const orContent: {}[] = [];
  methods.forEach(method => {
    switch (method) {
      case 'CREATE':
        orContent.push(andCondition('POST', '^(?!{"_id").*'));
        break;
      case 'UPDATE':
        orContent.push(andCondition('POST', '^({"_id").*'));
        orContent.push(andCondition('PUT', '^({"_id").*'));
        break;
      case 'DELETE':
        orContent.push(andCondition('DELETE', '^({"_id").*'));
        break;
      default:
        orContent.push({
          method,
        });
        break;
    }
  });
  return orContent;
};
const sanitizeTime = (time: { [k: string]: unknown }) => (memo: {}, k: string) =>
  time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo;

const equivalentHttpMethod = (method: string): string =>
  ['CREATE', 'UPDATE'].includes(method.toUpperCase()) ? 'POST' : method.toUpperCase();

class ActivityLogFilter {
  andQuery: {}[] = [];

  searchQuery: {}[] = [];

  query: ActivityLogQuery;

  constructor(requestQuery: ActivityLogQuery) {
    const methodFilter = ((requestQuery || {}).method || []).map(method => method.toUpperCase());
    this.query = { ...requestQuery, method: methodFilter };
  }

  timeQuery() {
    const { time = {}, before = -1 } = this.query || {};

    const sanitizedTime = Object.keys(time).reduce(sanitizeTime(time), {});

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
    const filterValue = (this.query || {})[property];
    if (filterValue !== undefined) {
      const exp = filterValue.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&');

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
    const { search } = this.query || {};
    if (search !== undefined) {
      const regex = {
        $regex: `.*${search.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}.*`,
        $options: 'si',
      };
      this.searchQuery.push({
        $or: [
          {
            method: {
              $regex: `${search
                .toUpperCase()
                .replace('CREATE', 'POST')
                .replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}`,
            },
          },
          { url: { $regex: `^${search.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}$` } },
          { query: regex },
          { body: regex },
          { params: regex },
        ],
      });
    }
  }

  methodFilter() {
    const { method: methods = [] } = this.query || {};
    if (methods.length > 0) {
      const queryMethods = methods.map(equivalentHttpMethod);
      const matchedEntries = parsedActionsEntries.filter(
        ([key, value]) =>
          key.toUpperCase().match(`(${queryMethods.join('|')}).*`) &&
          ((value.method || '').toUpperCase().match(`(${methods.join('|')}).*`) ||
            value.desc.toUpperCase().match(`(${methods.join('|')}).*`))
      );
      const bodyTerm = bodyCondition(methods);
      if (bodyTerm.length > 0) {
        this.andQuery.push({ $or: bodyTerm });
      }
      if (matchedEntries.length > 0) {
        const orUrlItems = queryURL(matchedEntries);
        this.andQuery.push({ $or: orUrlItems });
      }
    }
  }

  openSearchFilter() {
    const { search } = this.query || {};
    if (search === undefined) {
      return;
    }
    const matchedURLs = parsedActionsEntries.filter(([_key, value]) =>
      value.desc.toLowerCase().includes(search.toLocaleLowerCase() || '')
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
    const { find } = this.query || {};
    if (find) {
      const regex = {
        $regex: `.*${find.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}.*`,
        $options: 'si',
      };
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
    const { username } = this.query || {};
    if (username) {
      const orUser: {}[] = [
        {
          username: {
            $regex: `.*${username.replace(/[.*\/+?^${}()|[\]\\]/g, '\\$&')}.*`,
            $options: 'si',
          },
        },
      ];
      if (username === 'anonymous') {
        orUser.push({ username: null });
      }
      this.andQuery.push({ $or: orUser });
    }
  }

  prepareQuery() {
    this.prepareRegexpQueries();
    this.methodFilter();
    this.openSearchFilter();
    this.findFilter();
    this.userFilter();
    this.timeQuery();
    return !isEmpty(this.andQuery) ? { $and: this.andQuery } : {};
  }
}

export { ActivityLogFilter };
