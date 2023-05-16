import { DenormalizationStrategy } from './DenormalizationStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

interface Denormalizer {
  execute: (sharedId: string) => Promise<void>;
}

async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class OnlineDenormalizationStrategy implements DenormalizationStrategy {
  private indexEntities: IndexEntitiesCallback;

  private denormalizer: Denormalizer;

  constructor(indexEntities: IndexEntitiesCallback, denormalizer: Denormalizer) {
    this.indexEntities = indexEntities;
    this.denormalizer = denormalizer;
  }

  async execute(candidateIds: string[]) {
    await delay(15000);
    await candidateIds.reduce(async (previous, id) => {
      console.log(`[${OnlineDenormalizationStrategy.name}] Denormalizing ${id}`);
      await previous;
      return this.denormalizer.execute(id);
    }, Promise.resolve());

    return this.indexEntities(candidateIds);
  }
}
