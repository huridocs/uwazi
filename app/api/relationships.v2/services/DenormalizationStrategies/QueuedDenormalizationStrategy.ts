import { DenormalizationStrategy } from './DenormalizationStrategy';

export class QueuedDenormalizationStrategy implements DenormalizationStrategy {
  async execute(candidateIds: string[]): Promise<void> {
    console.log(
      `[${QueuedDenormalizationStrategy.name}] Fake enqueuing: ${candidateIds.join(', ')}`
    );
  }
}
