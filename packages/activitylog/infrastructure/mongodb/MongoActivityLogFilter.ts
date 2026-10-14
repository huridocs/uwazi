import moment from 'moment';
import type { Filter } from 'mongodb';
import { escapeEspecialChars } from '#shared/data_utils/stringUtils.js';
import { ActivityCatalog, RouteReference } from '../query/ActivityCatalog.js';
import type { ActivityLogFilters } from '../query/ActivityLogQueryService.js';
import type { MongoActivityLogDBO } from './MongoActivityLogDBO.js';

type Condition = Filter<MongoActivityLogDBO>;
type RequestDetail = 'url' | 'query' | 'body' | 'params';

const ANONYMOUS = 'anonymous';

/** Turns the module's filters into the query the `activitylogs` collection is read with. */
class MongoActivityLogFilter {
  static build(filters: ActivityLogFilters): Condition {
    const actions = (filters.actions ?? []).map(action => action.toUpperCase());

    const conditions = [
      ...MongoActivityLogFilter.requestDetails(filters),
      ...MongoActivityLogFilter.actions(actions),
      ...MongoActivityLogFilter.search(filters.search),
      ...MongoActivityLogFilter.find(filters.find),
      ...MongoActivityLogFilter.user(filters.username),
      ...MongoActivityLogFilter.time(filters),
    ];

    const query = conditions.length > 0 ? MongoActivityLogFilter.flatten({ $and: conditions }) : {};

    if (filters.username) {
      query.username =
        filters.username !== ANONYMOUS ? filters.username : { $in: [null, filters.username] };
    }

    return query;
  }

  /** `to` takes in the whole of its day. */
  static timeRange({ from, to }: { from?: number; to?: number }) {
    const fromDate = from && new Date(from);
    const toDate = to && moment(new Date(to)).add(1, 'day').toDate();
    return {
      ...(fromDate && { $gte: fromDate.getTime() }),
      ...(toDate && { $lt: toDate.getTime() }),
    };
  }

  /**
   * Creating and updating are both made through POST, and are told apart by whether the request
   * named an existing record at the start of its body.
   */
  static bodyCondition(actions: string[]): Condition[] {
    const carrying = (method: string, regex: string, property: 'body' | 'query' = 'body') => ({
      $and: [{ method }, { [property]: { $regex: regex } }],
    });

    return actions.flatMap((action): Condition[] => {
      switch (action) {
        case 'CREATE':
          return [
            {
              $and: [
                carrying('POST', '^(?!{"_id").*'),
                carrying('POST', '^(?!{"entity":"{\\\\"_id).*'),
              ],
            },
          ];
        case 'UPDATE':
          return [
            carrying('POST', '^({"_id").*'),
            carrying('POST', '^({"entity":"{\\\\"_id).*'),
            carrying('PUT', '^({"_id").*'),
            carrying('PUT', '^({"entity":"{\\\\"_id).*'),
          ];
        case 'DELETE':
          return [
            carrying('DELETE', '^({"_id").*'),
            carrying('DELETE', '^({"_id").*', 'query'),
            carrying('DELETE', '^({"sharedId").*', 'query'),
          ];
        default:
          return [{ method: action }];
      }
    });
  }

  private static requestDetails(filters: ActivityLogFilters): Condition[] {
    const detail = (property: RequestDetail, exact = false): Condition[] => {
      const value = filters[property];
      if (value === undefined) return [];

      const text = escapeEspecialChars(value);
      return [{ [property]: { $regex: exact ? `^${text}$` : text } }];
    };

    return [...detail('url', true), ...detail('query'), ...detail('body'), ...detail('params')];
  }

  private static actions(actions: string[]): Condition[] {
    if (actions.length === 0) return [];

    const carrying = MongoActivityLogFilter.bodyCondition(actions);
    const routes = MongoActivityLogFilter.routes(ActivityCatalog.routesForActions(actions));

    return [
      ...(carrying.length > 0 ? [{ $or: carrying }] : []),
      ...(routes.length > 0 ? [{ $or: routes }] : []),
    ];
  }

  /** By description when one contains the text; otherwise by the text anywhere in the request. */
  private static search(search?: string): Condition[] {
    if (search === undefined) return [];

    const described = MongoActivityLogFilter.routes(ActivityCatalog.routesDescribedAs(search));
    if (described.length > 0) return [{ $or: [{ $or: described }] }];

    const anywhere = { $regex: `.*${escapeEspecialChars(search)}.*`, $options: 'si' };
    return [
      {
        $or: [
          {
            $or: [
              {
                method: {
                  $regex: `${escapeEspecialChars(search.toUpperCase().replace('CREATE', 'POST'))}`,
                },
              },
              { url: { $regex: `^${escapeEspecialChars(search)}$` } },
              { query: anywhere },
              { body: anywhere },
              { params: anywhere },
            ],
          },
        ],
      },
    ];
  }

  private static find(find?: string): Condition[] {
    if (!find) return [];

    const anywhere = { $regex: `.*${escapeEspecialChars(find)}.*`, $options: 'si' };
    return [
      {
        $or: [
          { method: anywhere },
          { url: anywhere },
          { query: anywhere },
          { body: anywhere },
          { params: anywhere },
        ],
      },
    ];
  }

  private static user(username?: string): Condition[] {
    if (!username) return [];

    return [
      {
        $or: [
          { username: { $regex: `.*${escapeEspecialChars(username)}.*`, $options: 'si' } },
          ...(username === ANONYMOUS ? [{ username: null }] : []),
        ],
      },
    ];
  }

  /** `before` replaces the range when both are given. */
  private static time({ time = {}, before }: ActivityLogFilters): Condition[] {
    const hasRange = time.from !== undefined || time.to !== undefined;
    if (before === undefined && !hasRange) return [];

    return [
      {
        ...(hasRange ? { time: MongoActivityLogFilter.timeRange(time) } : {}),
        ...(before !== undefined ? { time: { $lt: before } } : {}),
      },
    ];
  }

  private static routes(routes: RouteReference[]): Condition[] {
    return routes.map(({ method, url }) => ({
      $and: [{ url: { $regex: `^${escapeEspecialChars(url)}$` } }, { method }],
    }));
  }

  /** Unwraps every `$and` and `$or` holding a single condition. */
  private static flatten(condition: Condition): Condition {
    return Object.keys(condition).reduce<Condition>((memo, key) => {
      const value = (condition as Record<string, unknown>)[key];
      if (['$and', '$or'].includes(key) && Array.isArray(value) && value.length === 1) {
        return { ...memo, ...MongoActivityLogFilter.flatten(value[0]) };
      }
      return { ...memo, [key]: value };
    }, {});
  }
}

export { MongoActivityLogFilter };
