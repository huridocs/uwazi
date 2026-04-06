import { QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { SearchOptions, SearchResponse } from '../Types.js';
import { User } from '#api/users.v2/model/User.js';

type Deps = {
  actor: User | null;
  elasticClient: TenantAwareESClient;
};

class AuthorizedEntityESClient {
  constructor(private deps: Deps) {}

  async search(query: SearchOptions): Promise<SearchResponse<any>> {
    const permissionFilter = this.buildPermissionFilter();

    const guardedQuery = permissionFilter
      ? this.applyPermissionFilter(query.query, permissionFilter)
      : query.query;

    return this.deps.elasticClient.search({ ...query, query: guardedQuery });
  }

  private buildPermissionFilter() {
    switch (this.deps.actor?.role) {
      case 'admin':
      case 'editor':
        return null;

      case 'collaborator':
        return {
          bool: {
            should: [
              { term: { published: true } },
              {
                terms: {
                  permissionRefIds: [this.deps.actor._id, ...this.deps.actor.groups],
                },
              },
            ],
            minimum_should_match: 1,
          },
        };

      default:
        return { term: { published: true } };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private applyPermissionFilter(
    query: QueryDslQueryContainer,
    permissionFilter: QueryDslQueryContainer
  ): QueryDslQueryContainer {
    if (query.bool) {
      let existing: QueryDslQueryContainer[] = [];

      if (Array.isArray(query.bool.filter)) {
        existing = query.bool.filter;
      } else if (query.bool.filter) {
        existing = [query.bool.filter];
      }

      return {
        bool: { ...query.bool, filter: [...existing, permissionFilter] },
      };
    }

    return {
      bool: { must: [query], filter: [permissionFilter] },
    };
  }
}

export { AuthorizedEntityESClient };
