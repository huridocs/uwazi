export class GraphQueryResult {
  readonly entities: unknown[] = [];

  readonly relationships: unknown[] = [];

  readonly path: unknown[];

  constructor(path: unknown[]) {
    this.path = path;
    path.forEach((elem, index) => {
      if (index % 2) {
        this.relationships.push(elem);
      } else {
        this.entities.push(elem);
      }
    });
  }

  leaf() {
    return this.entities[this.entities.length - 1];
  }
}
