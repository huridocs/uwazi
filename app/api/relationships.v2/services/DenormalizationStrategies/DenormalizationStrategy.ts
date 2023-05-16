export interface DenormalizationStrategy {
  execute(candidateIds: string[]): Promise<void>;
}
