import { isEmpty } from 'lodash';
import { FilterQuery } from 'mongoose';
import moment from 'moment';
import { ActivityLogGetRequest } from 'shared/types/activityLogApiTypes';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { escapeEspecialChars } from 'shared/data_utils/stringUtils';
import { ParsedActions } from './activitylogParser';
import { EntryValue } from './activityLogBuilder';

type ActivityLogQuery = Required<ActivityLogGetRequest>['query'];
type ActivityLogQueryTime = Required<ActivityLogQuery>['time'];
const prepareToFromRanges = (sanitizedTime: ActivityLogQueryTime) => {
  const fromDate = sanitizedTime.from && new Date(sanitizedTime.from);
  const toDate = sanitizedTime.to && moment(new Date(sanitizedTime.to)).add(1, 'day').toDate();
  return {
    ...(fromDate && { $gte: fromDate.getTime() }),
    ...(toDate && { $lt: toDate.getTime() }),
  };
};
const parsedActionsEntries = Object.entries(ParsedActions);
const queryURL = (matchedEntries: [string, EntryValue][]) =>
  matchedEntries.map(([key]) => {
    const entries = key.split(/\/(.*)/s);
    const condition = {
      $and: [
        { url: { $regex: `^\\/${escapeEspecialChars(entries[1])}$` } },
        { method: entries[0] },
      ],
    };
    return condition;
  });
const andCondition = (method: string, regex: string, property: string = 'body') => ({
  $and: [{ method }, { [property]: { $regex: regex } }],
});
const bodyCondition = (methods: string[]) => {
  const orContent: FilterQuery<ActivityLogEntryType>[] = [];
  methods.forEach(method => {
    switch (method) {
      case 'CREATE':
        orContent.push({
          $and: [
            andCondition('POST', '^(?!{"_id").*'),
            andCondition('POST', '^(?!{"entity":"{\\\\"_id).*'),
          ],
        });
        break;
      case 'UPDATE':
        orContent.push(andCondition('POST', '^({"_id").*'));
        orContent.push(andCondition('POST', '^({"entity":"{\\\\"_id).*'));
        orContent.push(andCondition('PUT', '^({"_id").*'));
        orContent.push(andCondition('PUT', '^({"entity":"{\\\\"_id).*'));
        break;
      case 'DELETE':
        orContent.push(andCondition('DELETE', '^({"_id").*'));
        orContent.push(andCondition('DELETE', '^({"_id").*', 'query'));
        orContent.push(andCondition('DELETE', '^({"sharedId").*', 'query'));
        break;
      default:
        orContent.push({ method });
        break;
    }
  });
  return orContent;
};
const sanitizeTime = (time: ActivityLogQueryTime) => (memo: {}, k: string) =>
  time[k] !== null ? Object.assign(memo, { [k]: time[k] }) : memo;
const equivalentHttpMethod = (method: string): string =>
  ['CREATE', 'UPDATE'].includes(method.toUpperCase()) ? 'POST' : method.toUpperCase();
const matchWithParsedEntry = (
  key: string,
  queryMethods: string[],
  value: EntryValue,
  methods: string[]
) =>
  key.toUpperCase().match(`(${queryMethods.join('|')}).*`) &&
  ((value.method || '').toUpperCase().match(`(${methods.join('|')}).*`) ||
    value.desc.toUpperCase().match(`(${methods.join('|')}).*`));
const reduceUniqueCondition: (
  condition: FilterQuery<ActivityLogEntryType>
) => FilterQuery<ActivityLogEntryType> = (condition: FilterQuery<ActivityLogEntryType>) => {
  const keys = Object.keys(condition);
  return keys.reduce((memo, key) => {
    if (['$and', '$or'].includes(key) && condition[key]?.length === 1) {
      const reducedCondition = reduceUniqueCondition(condition[key][0]);
      return { ...memo, ...reducedCondition };
    }
    return { ...memo, [key]: condition[key] };
  }, {});
};
class ActivityLogFilter {
  andQuery: FilterQuery<ActivityLogEntryType>[] = [];

  searchQuery: FilterQuery<ActivityLogEntryType>[] = [];

  query: ActivityLogQuery;

  constructor(requestQuery: ActivityLogQuery) {
    const methodFilter = ((requestQuery || {}).method || []).map(method => method.toUpperCase());
    this.query = { ...requestQuery, method: methodFilter };
  }

  timeQuery() {
    const { time = {}, before = -1 } = this.query || {};
    const sanitizedTime: ActivityLogQueryTime = Object.keys(time).reduce(sanitizeTime(time), {});
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
      const exp = escapeEspecialChars(filterValue);
      this.andQuery.push({ [property]: { $regex: exact ? `^${exp}$` : exp } });
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
      const regex = { $regex: `.*${escapeEspecialChars(search)}.*`, $options: 'si' };
      this.searchQuery.push({
        $or: [
          {
            method: {
              $regex: `${escapeEspecialChars(search.toUpperCase().replace('CREATE', 'POST'))}`,
            },
          },
          { url: { $regex: `^${escapeEspecialChars(search)}$` } },
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
      const matchedEntries = parsedActionsEntries.filter(([key, value]) =>
        matchWithParsedEntry(key, queryMethods, value, methods)
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
    if (matchedURLs.length > 0) {
      this.searchQuery.push({ $or: orUrlItems });
    } else {
      this.searchFilter();
    }
    if (this.searchQuery.length > 0) {
      this.andQuery.push({ $or: this.searchQuery });
    }
  }

  findFilter() {
    const { find } = this.query || {};
    if (find) {
      const regex = { $regex: `.*${escapeEspecialChars(find)}.*`, $options: 'si' };
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
      const orUser: FilterQuery<ActivityLogEntryType>[] = [
        { username: { $regex: `.*${escapeEspecialChars(username)}.*`, $options: 'si' } },
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
    const rootQuery = !isEmpty(this.andQuery) ? reduceUniqueCondition({ $and: this.andQuery }) : {};
    return rootQuery;
  }
}
export type { ActivityLogQueryTime };
export { ActivityLogFilter, prepareToFromRanges, bodyCondition };
