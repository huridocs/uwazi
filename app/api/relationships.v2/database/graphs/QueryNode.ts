export abstract class QueryNode {
  abstract compile(index: number): object[];

  protected abstract getChildrenNodes(): QueryNode[];

  protected abstract getProjection(): Record<string, 1 | {}>;

  protected compileChildren() {
    return this.getChildrenNodes().reduce<object[]>(
      (reduced, nested, index) => reduced.concat(nested.compile(index)),
      []
    );
  }

  protected projectAndArrangeTraversals() {
    const traversalFields = [];
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < this.getChildrenNodes().length; index++) {
      traversalFields.push(`$traversal-${index}`);
    }

    return [
      {
        $project: { ...this.getProjection(), traversal: { $concatArrays: traversalFields } },
      },
    ];
  }

  protected unwind() {
    return this.getChildrenNodes().length ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
  }
}
