import { Client } from '@elastic/elasticsearch';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { IndexDefinition } from '../Types';

type Deps = {
  client: Client;
  registry: Record<string, IndexDefinition>;
};

class IndexBootstrapper {
  constructor(private deps: Deps) {}

  async bootstrapAll(): Promise<void> {
    await ArrayUtils.sequentialFor(Object.entries(this.deps.registry), async ([name, definition]) =>
      this.bootstrapOne(name, definition)
    );
  }

  async bootstrapOne(_name: string, definition: IndexDefinition): Promise<void> {
    const { alias, physicalPrefix, settings, mappings } = definition;
    const physicalIndex = `${physicalPrefix}_v1`;

    const exists = await this.deps.client.indices.existsAlias({ name: alias });

    if (exists.body) {
      console.log(`[IndexBootstrapper] Alias "${alias}" already exists — skipping creation.`);
      return;
    }

    await this.deps.client.indices.create({
      index: physicalIndex,
      body: {
        settings,
        mappings,
        aliases: { [alias]: {} },
      },
    });
  }
}

export { IndexBootstrapper };
