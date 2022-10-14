export class GraphQueryResult {
  readonly entities: any[] = [];

  readonly relationships: any[] = [];

  readonly path: any[];

  constructor(path: any[]) {
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
