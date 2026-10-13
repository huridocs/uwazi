import moment from 'moment';
import { escapeEspecialChars } from '#shared/data_utils/stringUtils.js';
import { ActivityCatalog, RouteReference } from '../../application/ActivityCatalog.js';
import type { ActivityLogFilters } from '../../application/contracts/ActivityLogQueryService.js';

/** A boolean SQL expression with the values it binds: `??` for a column, `?` for a value. */
type Condition = { sql: string; bindings: (string | number)[] };
type RequestDetail = 'url' | 'query' | 'body' | 'params';

const ANONYMOUS = 'anonymous';

/**
 * Turns the module's filters into the condition the `activitylogs` table is read with. Patterns
 * are POSIX regular expressions matched against the stored text, the same ones Mongo is given.
 */
class PostgresActivityLogFilter {
  /** Undefined when the filters leave every entry in. */
  static build(filters: ActivityLogFilters): Condition | undefined {
    const actions = (filters.actions ?? []).map(action => action.toUpperCase());

    const conditions = [
      ...PostgresActivityLogFilter.requestDetails(filters),
      ...PostgresActivityLogFilter.actions(actions),
      ...PostgresActivityLogFilter.search(filters.search),
      ...PostgresActivityLogFilter.find(filters.find),
      ...PostgresActivityLogFilter.user(filters.username),
      ...PostgresActivityLogFilter.time(filters),
    ];

    return conditions.length > 0 ? PostgresActivityLogFilter.all(conditions) : undefined;
  }

  private static requestDetails(filters: ActivityLogFilters): Condition[] {
    const detail = (property: RequestDetail, exact = false): Condition[] => {
      const value = filters[property];
      if (value === undefined) return [];

      const text = escapeEspecialChars(value);
      return [PostgresActivityLogFilter.matches(property, exact ? `^${text}$` : text)];
    };

    return [...detail('url', true), ...detail('query'), ...detail('body'), ...detail('params')];
  }

  private static actions(actions: string[]): Condition[] {
    if (actions.length === 0) return [];

    const carrying = actions.flatMap(PostgresActivityLogFilter.carrying);
    const routes = PostgresActivityLogFilter.routes(ActivityCatalog.routesForActions(actions));

    return [
      ...(carrying.length > 0 ? [PostgresActivityLogFilter.any(carrying)] : []),
      ...(routes.length > 0 ? [PostgresActivityLogFilter.any(routes)] : []),
    ];
  }

  /**
   * Creating and updating are both made through POST, and are told apart by whether the request
   * named an existing record at the start of its body.
   */
  private static carrying(this: void, action: string): Condition[] {
    const { all, is, matches } = PostgresActivityLogFilter;
    const made = (method: string, pattern: string, property: 'body' | 'query' = 'body') =>
      all([is('method', method), matches(property, pattern)]);

    switch (action) {
      case 'CREATE':
        return [all([made('POST', '^(?!{"_id").*'), made('POST', '^(?!{"entity":"{\\\\"_id).*')])];
      case 'UPDATE':
        return [
          made('POST', '^({"_id").*'),
          made('POST', '^({"entity":"{\\\\"_id).*'),
          made('PUT', '^({"_id").*'),
          made('PUT', '^({"entity":"{\\\\"_id).*'),
        ];
      case 'DELETE':
        return [
          made('DELETE', '^({"_id").*'),
          made('DELETE', '^({"_id").*', 'query'),
          made('DELETE', '^({"sharedId").*', 'query'),
        ];
      default:
        return [is('method', action)];
    }
  }

  /** By description when one contains the text; otherwise by the text anywhere in the request. */
  private static search(search?: string): Condition[] {
    if (search === undefined) return [];

    const described = PostgresActivityLogFilter.routes(ActivityCatalog.routesDescribedAs(search));
    if (described.length > 0) return [PostgresActivityLogFilter.any(described)];

    const { matches } = PostgresActivityLogFilter;
    const anywhere = `.*${escapeEspecialChars(search)}.*`;
    return [
      PostgresActivityLogFilter.any([
        matches('method', escapeEspecialChars(search.toUpperCase().replace('CREATE', 'POST'))),
        matches('url', `^${escapeEspecialChars(search)}$`),
        matches('query', anywhere, true),
        matches('body', anywhere, true),
        matches('params', anywhere, true),
      ]),
    ];
  }

  private static find(find?: string): Condition[] {
    if (!find) return [];

    const anywhere = `.*${escapeEspecialChars(find)}.*`;
    return [
      PostgresActivityLogFilter.any(
        ['method', 'url', 'query', 'body', 'params'].map(column =>
          PostgresActivityLogFilter.matches(column, anywhere, true)
        )
      ),
    ];
  }

  /** The exact username, whatever its case; `anonymous` also takes entries made without a user. */
  private static user(username?: string): Condition[] {
    if (!username) return [];

    const exact: Condition = { sql: 'lower(??) = lower(?)', bindings: ['username', username] };
    const nobody: Condition = { sql: '?? IS NULL', bindings: ['username'] };

    return [username === ANONYMOUS ? PostgresActivityLogFilter.any([nobody, exact]) : exact];
  }

  /** `to` takes in the whole of its day, and `before` replaces the range when both are given. */
  private static time({ time = {}, before }: ActivityLogFilters): Condition[] {
    if (before !== undefined) return [{ sql: '?? < ?', bindings: ['time', before] }];

    const from: Condition[] =
      time.from !== undefined ? [{ sql: '?? >= ?', bindings: ['time', time.from] }] : [];
    const to: Condition[] =
      time.to !== undefined
        ? [
            {
              sql: '?? < ?',
              bindings: ['time', moment(new Date(time.to)).add(1, 'day').toDate().getTime()],
            },
          ]
        : [];

    return [...from, ...to];
  }

  private static routes(routes: RouteReference[]): Condition[] {
    const { all, is, matches } = PostgresActivityLogFilter;
    return routes.map(({ method, url }) =>
      all([matches('url', `^${escapeEspecialChars(url)}$`), is('method', method)])
    );
  }

  private static is(this: void, column: string, value: string): Condition {
    return { sql: '?? = ?', bindings: [column, value] };
  }

  /** A column without a value matches no pattern, as in Mongo. */
  private static matches(this: void, column: string, pattern: string, anyCase = false): Condition {
    return { sql: `?? ${anyCase ? '~*' : '~'} ?`, bindings: [column, pattern] };
  }

  private static all(this: void, conditions: Condition[]): Condition {
    return PostgresActivityLogFilter.joined(conditions, ' AND ');
  }

  private static any(this: void, conditions: Condition[]): Condition {
    return PostgresActivityLogFilter.joined(conditions, ' OR ');
  }

  private static joined(conditions: Condition[], operator: string): Condition {
    return {
      sql: conditions.map(({ sql }) => `(${sql})`).join(operator),
      bindings: conditions.flatMap(({ bindings }) => bindings),
    };
  }
}

export { PostgresActivityLogFilter };
