import { PipelineStage } from 'mongoose';

export class PipelineBuilder {
  constructor(private pipeline: PipelineStage[] = []) {}

  add(stage: PipelineStage) {
    const length = this.pipeline.push(stage);

    return length - 1;
  }

  addAt(stage: PipelineStage, index: number) {
    this.pipeline.splice(index, 0, stage);
  }

  build() {
    const pipeline = [...this.pipeline];
    this.pipeline = [];

    return pipeline;
  }
}
