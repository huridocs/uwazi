import { Property } from './Property';

class V1RelationshipProperty extends Property {
  readonly content?: string;

  readonly relationType: string;

  constructor(
    id: string,
    name: string,
    label: string,
    relationType: string,
    template: string,
    content?: string
  ) {
    super(id, 'relationship', name, label, template);
    this.content = content;
    this.relationType = relationType;
  }
}

export { V1RelationshipProperty };
