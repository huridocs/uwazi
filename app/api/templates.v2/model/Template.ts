import { Property } from './Property';

class Template {
  readonly id: string;

  readonly name: string;

  readonly properties: Property[] = [];

  constructor(id: string, name: string, properties: Property[] = []) {
    this.id = id;
    this.name = name;
    this.properties = properties;
  }

  selectNewProperties(newTemplate: Template): Property[] {
    const oldIdSet = new Set(this.properties.map(p => p.id));
    return newTemplate.properties.filter(p => !oldIdSet.has(p.id));
  }
}

export { Template };
