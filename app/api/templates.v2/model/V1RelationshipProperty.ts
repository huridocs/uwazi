import { Property } from './Property';

class V1RelationshipProperty extends Property {
  readonly content: string;

  readonly relationType: string;

  static ALL_MARKER = '';

  constructor(
    id: string,
    name: string,
    label: string,
    content: string,
    relationType: string,
    template: string
  ) {
    super(id, 'relationship', name, label, template);
    this.content = content;
    this.relationType = relationType;
  }
}

export { V1RelationshipProperty };
