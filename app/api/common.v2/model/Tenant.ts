class Tenant {
  name: string;

  dbName: string;

  indexName: string;

  constructor(name: string, dbName: string, indexName: string) {
    this.name = name;
    this.dbName = dbName;
    this.indexName = indexName;
  }
}

export { Tenant };
