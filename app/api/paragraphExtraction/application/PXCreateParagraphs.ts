import { UseCase } from 'api/common.v2/contracts/UseCase';

import { PXCreateParagraphInput } from './PXCreateParagraph';

type PXCreateParagraphsInput = PXCreateParagraphInput[];

type Output = any;

type Dependencies = {};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: PXCreateParagraphsInput): Promise<Output> {
    /**
     * Call PXCreateParagraph use case passing each paragraph
     *
     */
  }
}

export type { PXCreateParagraphsInput };

/**
 * The idea is to put each paragraph in to a Queue
 * This Task will execute the PXCreateParagraph
 */
