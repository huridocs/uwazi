import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { buildGraphLayout } from '../relationshipsPanelGraph.js';

const marker = (id: string, target: string, type = 'relA'): RelationshipMarker => ({
  _id: id,
  view: {
    _id: id,
    hub: `hub-${id}`,
    type,
    from: { type: 'entity', entity: 'self1', entityTitle: 'Source', entityTemplateId: 'tpl1' },
    to: { type: 'entity', entity: target, entityTitle: target, entityTemplateId: 'tpl2' },
    relationTypeOnSelf: true,
  },
  target: { sharedId: target, title: target, templateId: 'tpl2' },
});

const context = {
  selfSharedId: 'self1',
  selfTitle: 'Source',
  selfTemplateId: 'tpl1',
  relationshipTypeName: (id: string) => id,
  templateName: () => 'Template',
  templateColor: () => '#00aa00',
};

describe('relationshipsPanelGraph', () => {
  it('builds graph nodes from markers', () => {
    const { nodes, spokes } = buildGraphLayout(
      [marker('1', 'a'), marker('2', 'b')],
      'self1',
      'none',
      context
    );
    expect(nodes).toHaveLength(2);
    expect(spokes).toHaveLength(1);
  });
});
