import { UseCase } from 'api/common.v2/contracts/UseCase';

import { PXExtractionService } from '../domain/PXExtractionService';

type Input = {
  resultUrl: string;
};

type Output = any;

type Dependencies = {
  extractionService: PXExtractionService;
};

export class PXCreateParagraphs implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const { paragraphsResult } = await this.getInitialData(input);
  }

  private async getInitialData(input: Input) {
    const paragraphsResult = await this.dependencies.extractionService.getParagraphsResult(
      input.resultUrl
    );

    return { paragraphsResult };
  }
}
