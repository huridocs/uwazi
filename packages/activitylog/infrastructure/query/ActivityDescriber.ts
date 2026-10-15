import { ActivityCatalog, RouteDescriptor } from './ActivityCatalog.js';
import type { ActivityDescription } from './ActivityDescription.js';
import type { ActivityData, RelatedData } from './RelatedData.js';
import { MigrationLogDescriber } from './MigrationLogDescriber.js';

//cc: it seems this component is used to display data to clients, if that true it should be colocated inside infrastructure/query

type DescribedRequest = {
  method: string;
  url: string;
  body?: string;
  query?: string;
};

type Deps = {
  related: RelatedData;
};

const MIGRATION = 'MIGRATE';

/**
 * Says what a logged request did, from the route it was made to and what it carried. The names it
 * gives are read from the application as it is now, not as it was when the request was made. An
 * entry it cannot describe is reported as a WARNING instead of failing the whole listing.
 */
class ActivityDescriber {
  constructor(private readonly deps: Deps) {}

  async describe(request: DescribedRequest): Promise<ActivityDescription> {
    const action = `${request.method}${request.url}`;
    if (action === MIGRATION) {
      return MigrationLogDescriber.describe(request.body ?? '');
    }

    const descriptor: RouteDescriptor = (ActivityCatalog.routes[action] as
      RouteDescriptor | undefined) ?? {
      desc: '',
      extra: () => `${request.method}: ${request.url}`,
      method: 'RAW',
    };

    try {
      return await this.build(descriptor, request);
    } catch (e) {
      return {
        action: 'WARNING',
        description: 'The Activity log encountered an error in building the entry',
        extra: `${request.method}: ${request.url}`,
        errorStack: (e as Error).stack,
      };
    }
  }

  private async build(
    descriptor: RouteDescriptor,
    request: DescribedRequest
  ): Promise<ActivityDescription> {
    const body = request.body && request.body !== '{}' ? request.body : request.query || '{}';
    const { desc, method, id } = ActivityDescriber.asUpdateWhenItCarriesAnId(descriptor, body);

    const data = await this.withRelated(descriptor, JSON.parse(body));
    const name = ActivityDescriber.nameOf(descriptor, data, id);
    const extra = descriptor.extra?.(data);

    return {
      description: desc,
      action: method ?? 'UPDATE',
      ...(name && { name }),
      ...(extra && { extra }),
    };
  }

  private async withRelated(descriptor: RouteDescriptor, data: ActivityData) {
    return descriptor.related ? this.deps.related[descriptor.related](data) : data;
  }

  private static asUpdateWhenItCarriesAnId(
    descriptor: RouteDescriptor,
    body: string
  ): { desc: string; method?: RouteDescriptor['method']; id?: unknown } {
    if (!descriptor.idField) return descriptor;

    const content: ActivityData = JSON.parse(body);
    const json: ActivityData = content.entity ? JSON.parse(content.entity) : content;
    const id = json[descriptor.idField];

    return id && descriptor.method !== 'DELETE'
      ? { desc: descriptor.desc.replace('Created', 'Updated'), method: 'UPDATE', id }
      : descriptor;
  }

  private static nameOf(
    descriptor: RouteDescriptor,
    data: ActivityData,
    id?: unknown
  ): string | undefined {
    if (descriptor.nameFunc) return descriptor.nameFunc(data);

    if (id) {
      const name = data[descriptor.nameField || 'name'];
      return name ? `${name} (${id})` : `${id}`;
    }

    return descriptor.nameField ? data[descriptor.nameField] || data.name : undefined;
  }
}

export { ActivityDescriber };
export type { DescribedRequest };
