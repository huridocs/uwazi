import { DenormalizationStrategy } from './DenormalizationStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

export class OnlineDenormalizationStrategy implements DenormalizationStrategy {
  private indexEntities: IndexEntitiesCallback;

  constructor(indexEntities: IndexEntitiesCallback) {
    this.indexEntities = indexEntities;
  }

  async execute(candidateIds: string[]) {
    return this.indexEntities(candidateIds);
  }
}
