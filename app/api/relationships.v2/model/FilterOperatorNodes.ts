/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
interface Entity {
  sharedId: string;
  template: string;
}

export type FilterNode =
  | VoidFilterNode
  | AndFilterOperatorNode
  | IdFilterCriteriaNode
  | TemplateFilterCriteriaNode;

export class VoidFilterNode {
  shallowClone() {
    return new VoidFilterNode();
  }

  getTemplates(): string[] {
    return [];
  }

  wouldMatch() {
    return true;
  }
}

export class AndFilterOperatorNode {
  private operands: FilterNode[];

  constructor(operands: FilterNode[]) {
    this.operands = operands.length ? operands : [new VoidFilterNode()];
  }

  getOperands() {
    return this.operands;
  }

  shallowClone(): AndFilterOperatorNode {
    return new AndFilterOperatorNode(this.operands.map(o => o.shallowClone()));
  }

  getTemplates(): string[] {
    return this.operands.flatMap(o => o.getTemplates());
  }

  wouldMatch(entity: Entity): boolean {
    return this.operands.every(o => o.wouldMatch(entity));
  }
}

export class IdFilterCriteriaNode {
  private sharedId: string;

  constructor(sharedId: string) {
    this.sharedId = sharedId;
  }

  getSharedId() {
    return this.sharedId;
  }

  shallowClone() {
    return new IdFilterCriteriaNode(this.sharedId);
  }

  getTemplates(): string[] {
    return [];
  }

  wouldMatch(entity: Entity) {
    return entity.sharedId === this.sharedId;
  }
}

export class TemplateFilterCriteriaNode {
  private templates: string[];

  constructor(templates: string[] | string) {
    if (Array.isArray(templates)) {
      this.templates = templates;
    } else {
      this.templates = [templates];
    }
  }

  shallowClone() {
    return new TemplateFilterCriteriaNode(this.templates);
  }

  getTemplates(): string[] {
    return [...this.templates];
  }

  wouldMatch(entity: Entity) {
    return this.templates.includes(entity.template);
  }
}
