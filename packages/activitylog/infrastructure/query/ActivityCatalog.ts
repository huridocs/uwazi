import { CATALOG_ROUTES, RouteDescriptor } from './CatalogRoutes.js';

type RouteReference = { method: string; url: string };

/** The routes the activity log knows how to describe, and how to find them. */
class ActivityCatalog {
  static readonly routes = CATALOG_ROUTES;

  /** The routes whose description contains the text, whatever its case. */
  static routesDescribedAs(text: string): RouteReference[] {
    return ActivityCatalog.entries
      .filter(([, { desc }]) => desc.toLowerCase().includes(text.toLocaleLowerCase()))
      .map(([key]) => ActivityCatalog.toReference(key));
  }

  /**
   * The routes that carry out any of the actions. An action is either an HTTP method or one of
   * CREATE and UPDATE, which are both made through POST and told apart by how the catalog
   * describes the route.
   */
  static routesForActions(actions: string[]): RouteReference[] {
    if (actions.length === 0) return [];

    const asked = actions.map(action => action.toUpperCase());
    const httpMethods = asked.map(action =>
      ['CREATE', 'UPDATE'].includes(action) ? 'POST' : action
    );

    return ActivityCatalog.entries
      .filter(
        ([key, { method, desc }]) =>
          ActivityCatalog.containsAny(key, httpMethods) &&
          (ActivityCatalog.containsAny(method ?? '', asked) ||
            ActivityCatalog.containsAny(desc, asked))
      )
      .map(([key]) => ActivityCatalog.toReference(key));
  }

  private static containsAny(text: string, words: string[]): boolean {
    const upperCased = text.toUpperCase();
    return words.some(word => upperCased.includes(word));
  }

  private static get entries(): [string, RouteDescriptor][] {
    return Object.entries(ActivityCatalog.routes);
  }

  private static toReference(key: string): RouteReference {
    const [method, path] = key.split(/\/(.*)/s);
    return { method, url: `/${path}` };
  }
}

export { ActivityCatalog };
export type { RouteDescriptor, RouteReference };
