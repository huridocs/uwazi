import { Client } from '@elastic/elasticsearch';
import { IndexNameResolver } from '../IndexNameResolver';
import {
  ProvisioningResult,
  GroupAlreadyExistsError,
  GroupNotFoundError,
  TenantAlreadyInGroupError,
  IndexDefinition,
} from '../Types';
import { GroupAliasNameBuilder } from './GroupAliasNameBuilder';
import { TenantRoutingDataSource } from '../TenantRoutingDataSource';

type Deps = {
  esClient: Client;
  registry: Record<string, IndexDefinition>;
  routingRepository: TenantRoutingDataSource;
  resolver: IndexNameResolver;
};

class TenantProvisioningService {
  constructor(private deps: Deps) {}

  async createGroup(groupName: string, aliasName: string): Promise<ProvisioningResult> {
    const startMs = Date.now();
    const definition = this.deps.registry[aliasName];
    if (!definition) throw new Error(`Unknown logical index "${aliasName}"`);

    const alias = GroupAliasNameBuilder.toAlias(groupName, aliasName);
    const physicalIndex = GroupAliasNameBuilder.createInitialPhysicalIndex(groupName, aliasName);

    const aliasExists = await this.deps.esClient.indices.existsAlias({ name: alias });
    if (aliasExists.body) throw new GroupAlreadyExistsError(groupName, alias);

    await this.deps.esClient.indices.create({
      index: physicalIndex,
      body: {
        settings: definition.settings,
        mappings: definition.mappings,
        aliases: { [alias]: {} },
      },
    });

    return {
      success: true,
      operation: 'create-group',
      details: { groupName, aliasName, alias, physicalIndex },
      durationMs: Date.now() - startMs,
    };
  }

  /**
   * Assigns a tenant to an index group by copying their documents to the group alias.
   *
   * The operations are intentionally ordered for idempotency: the routing record is committed
   * before the source documents are deleted. If the service crashes between those two operations,
   * re-running will fail with `TenantAlreadyInGroupError` when updating the routing record — any
   * residual duplicate documents in the source index must then be cleaned up as a separate
   * recovery operation.
   */
  async assignTenant(
    tenantId: string,
    aliasName: string,
    groupName: string
  ): Promise<ProvisioningResult> {
    const startMs = Date.now();
    if (!this.deps.registry[aliasName]) throw new Error(`Unknown logical index "${aliasName}"`);

    const { currentAlias, targetAlias } = await this.resolveAssignment(
      tenantId,
      aliasName,
      groupName
    );
    const reindexedCount = await this.doTenantReindex(currentAlias, targetAlias, tenantId);

    await this.deps.routingRepository.upsertRoute({
      tenantId,
      aliasName,
      resolvedAlias: targetAlias,
      groupName,
    });
    this.deps.resolver.invalidate(tenantId, aliasName);

    await this.deps.esClient.deleteByQuery({
      index: currentAlias,
      body: { query: { term: { tenantId } } },
    });

    return {
      success: true,
      operation: 'assign-tenant',
      details: { tenantId, aliasName, groupName, targetAlias, reindexed: reindexedCount },
      durationMs: Date.now() - startMs,
    };
  }

  private async resolveAssignment(
    tenantId: string,
    aliasName: string,
    groupName: string
  ): Promise<{ currentAlias: string; targetAlias: string }> {
    const targetAlias = GroupAliasNameBuilder.toAlias(groupName, aliasName);
    const targetExists = await this.deps.esClient.indices.existsAlias({ name: targetAlias });
    if (!targetExists.body) throw new GroupNotFoundError(groupName, targetAlias);

    const currentAlias = await this.deps.resolver.resolve(aliasName, tenantId);
    if (currentAlias === targetAlias) throw new TenantAlreadyInGroupError(tenantId, groupName);

    return { currentAlias, targetAlias };
  }

  private async doTenantReindex(
    sourceAlias: string,
    targetAlias: string,
    tenantId: string
  ): Promise<number> {
    const startedAt = new Date().toISOString();

    const result: any = await this.deps.esClient.reindex({
      wait_for_completion: true,
      body: {
        source: { index: sourceAlias, query: { term: { tenantId } } },
        dest: { index: targetAlias, pipeline: 'none' },
      },
    });

    await this.deps.esClient.reindex({
      wait_for_completion: true,
      body: {
        source: {
          index: sourceAlias,
          query: {
            bool: {
              must: [{ term: { tenantId } }, { range: { updatedAt: { gte: startedAt } } }],
            },
          },
        },
        dest: { index: targetAlias, pipeline: 'none' },
      },
    });

    return result.body?.total ?? 0;
  }
}

export { TenantProvisioningService };
