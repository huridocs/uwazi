import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  ARC_GAP,
  FIRST_RING_R,
  FIT_PAD,
  FIT_SCALE_MAX,
  FIT_SCALE_MIN,
  LABEL_DIST,
  RING_GAP,
  SOURCE_R,
  VIEW_H,
  VIEW_W,
  buildGraphLayout,
  computeFitTransform,
  sourcePillWidth,
  truncateForFit,
} from '../relationshipsPanelGraph.js';

const marker = (
  id: string,
  target: string,
  type = 'relA',
  targetTemplateId = 'tpl2'
): RelationshipMarker => ({
  _id: id,
  relationship: {
    _id: id,
    hub: `hub-${id}`,
    type,
    from: { type: 'entity', entity: 'self1', entityTitle: 'Source', entityTemplateId: 'tpl1' },
    to: {
      type: 'entity',
      entity: target,
      entityTitle: target,
      entityTemplateId: targetTemplateId,
    },
    relationTypeOnSelf: true,
  },
  target: { sharedId: target, title: target, templateId: targetTemplateId },
});

const context = {
  selfSharedId: 'self1',
  selfTitle: 'Source',
  selfTemplateId: 'tpl1',
  relationshipTypeName: (id: string) => id,
  templateName: (id: string) => (id === 'tpl2' ? 'Person' : 'Case'),
  templateColor: (id: string) => {
    if (id === 'tpl2') return '#ff0000';
    if (id === 'tpl1') return '#00aa00';
    return undefined;
  },
};

describe('relationshipsPanelGraph', () => {
  it('uses design layout constants', () => {
    expect(VIEW_W).toBe(1200);
    expect(VIEW_H).toBe(900);
    expect(SOURCE_R).toBe(26);
    expect(LABEL_DIST).toBe(122);
    expect(FIRST_RING_R).toBe(200);
    expect(RING_GAP).toBe(40);
    expect(ARC_GAP).toBe(30);
    expect(FIT_PAD).toBe(40);
    expect(FIT_SCALE_MIN).toBe(0.4);
    expect(FIT_SCALE_MAX).toBe(2.5);
  });

  it('builds graph nodes from markers', () => {
    const { nodes, spokes } = buildGraphLayout(
      [marker('1', 'a'), marker('2', 'b')],
      'none',
      context
    );
    expect(nodes).toHaveLength(2);
    expect(spokes).toHaveLength(1);
  });

  it('caps node radius like design (min 7)', () => {
    const heavy = Array.from({ length: 40 }, (_, i) => marker(`e${i}`, 'same-target'));
    const { nodes } = buildGraphLayout(heavy, 'none', context);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.r).toBe(7);
  });

  it('resolves leaf fill from target template color with grey fallback', () => {
    const noColorCtx = {
      ...context,
      templateColor: (id: string) => (id === 'tpl-missing' ? undefined : context.templateColor(id)),
    };
    const colored = buildGraphLayout([marker('1', 'a', 'relA', 'tpl2')], 'none', context);
    expect(colored.nodes[0]?.color).toBe('#ff0000');
    expect(colored.nodes[0]?.typeName).toBe('Person');

    const grey = buildGraphLayout([marker('2', 'b', 'relA', 'tpl-missing')], 'none', noColorCtx);
    expect(grey.nodes[0]?.color).toBe('#9ca3af');
  });

  it('clamps multi-spoke sectorSpan so rings stay usable', () => {
    const many = Array.from({ length: 80 }, (_, i) => marker(String(i), `t${i}`, `rel${i}`));
    const { nodes } = buildGraphLayout(many, 'relation-type', context);
    expect(nodes.length).toBeGreaterThan(0);
    const xs = nodes.map(n => n.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(1);
  });

  it('sourcePillWidth uses max of title and type name', () => {
    const truncated = truncateForFit('abcdefghijklmnopqrstuvwxyzXXXX', 26);
    expect(truncated.endsWith('…')).toBe(true);
    expect(sourcePillWidth('Short', 'VeryLongTemplateName')).toBe(
      Math.max(72, 'VeryLongTemplateName'.length * 5.6 + 18)
    );
    expect(sourcePillWidth('A longer entity title here!!', 'T')).toBe(
      Math.max(72, truncateForFit('A longer entity title here!!', 26).length * 5.6 + 18)
    );
  });

  it('computeFitTransform clamps scale and recenters content', () => {
    const { nodes, spokes } = buildGraphLayout(
      [marker('1', 'a'), marker('2', 'b')],
      'none',
      context
    );
    const empty = computeFitTransform([], [], 'Source', 'Case');
    expect(empty).toEqual({ tx: 0, ty: 0, scale: 1 });

    const fitted = computeFitTransform(nodes, spokes, 'Source', 'Case');
    expect(fitted.scale).toBeGreaterThanOrEqual(FIT_SCALE_MIN);
    expect(fitted.scale).toBeLessThanOrEqual(FIT_SCALE_MAX);
    expect(Number.isFinite(fitted.tx)).toBe(true);
    expect(Number.isFinite(fitted.ty)).toBe(true);

    const wideType = computeFitTransform(nodes, spokes, 'Hi', 'WWWWWWWWWWWWWWWWWWWWWWWWWWWW');
    expect(wideType.scale).toBeLessThanOrEqual(fitted.scale);
  });
});
