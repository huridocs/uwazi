import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { Property } from 'api/templates.v2/model/Property';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { TemplateDiff } from '../TemplateDiff';
import { GenerateIdProperty } from '../GenerateIdProperty';

describe('TemplateDiff', () => {
  it('should detect new properties', () => {
    const base = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Text', template: 'template1' }),
      ])
      .build();

    const updated = TemplateBuilder.from(base)
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Text', template: 'template1' }),
        new Property({ id: 'p2', type: 'text', label: 'New Field', template: 'template1' }),
      ])
      .build();

    const diff = new TemplateDiff(base, updated);

    expect(diff.newProperties).toHaveLength(1);
    expect(diff.newProperties[0].id).toBe('p2');
  });

  it('should detect deleted properties', () => {
    const oldTemplate = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
        new Property({ id: 'p2', type: 'text', label: 'Description', template: 'template1' }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate)
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
        // p2 removed
      ])
      .build();

    const diff = new TemplateDiff(oldTemplate, newTemplate);

    expect(diff.deletedProperties).toHaveLength(1);
    expect(diff.deletedProperties[0]).toBe(oldTemplate.properties[1]);
    expect(diff.deletedPropertyNames).toEqual([oldTemplate.properties[1].name]);
  });

  it('should surface updatedProperties via the underlying template logic', () => {
    const t1 = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
      ])
      .build();

    const t2 = TemplateBuilder.from(t1)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title Edited 1',
          template: 'template1',
        }),
      ])
      .build();

    const diff = new TemplateDiff(t1, t2);

    expect(diff.updatedProperties).toHaveLength(1);
    expect(diff.updatedProperties[0].id).toBe('prop1');
  });

  it('should build renamedProperties map when name changed', () => {
    const t1 = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({
          id: 'p1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
        new Property({
          id: 'p2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const t2 = TemplateBuilder.from(t1)
      .withProperties([
        // p1 renamed
        new Property({
          id: 'p1',
          type: 'text',
          label: 'Title Edited',
          template: 'template1',
        }),
        // p2 unchanged name
        new Property({
          id: 'p2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const diff = new TemplateDiff(t1, t2);

    expect(Object.keys(diff.renamedProperties)).toHaveLength(1);
    expect(diff.renamedProperties.title_1).toBe('title_edited');
  });

  it('should detect V1 relationship-specific changes', () => {
    const templateWithRel1 = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'Connection',
          'relationship1',
          'template1',
          'content1',
          'inherited1'
        ),
        new V1RelationshipProperty(
          'rel2',
          'connection2',
          'Connection2',
          'relationship2',
          'template1',
          'content2',
          'inherited2'
        ),
      ])
      .build();

    const templateWithRel2 = TemplateBuilder.from(templateWithRel1)
      .withProperties([
        // rel1: only label changed (non-V1-specific)
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'Connection edited',
          'relationship1',
          'template1',
          'content1',
          'inherited1'
        ),
        // rel2: V1-specific attributes changed
        new V1RelationshipProperty(
          'rel2',
          'connection2',
          'Connection2',
          'relationship2_changed',
          'template1',
          'content2_changed',
          'inherited2_changed'
        ),
      ])
      .build();

    const diff = new TemplateDiff(templateWithRel1, templateWithRel2);

    expect(diff.relationshipPropsWithRelationshipChanges).toHaveLength(1);
    expect(diff.relationshipPropsWithRelationshipChanges[0]).toBe(templateWithRel2.properties[1]);
  });

  it('should identify newly added relationship properties', () => {
    const base = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
      ])
      .build();

    const updated = TemplateBuilder.from(base)
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
        new V1RelationshipProperty(
          'rel_new',
          'connection',
          'New Relationship',
          'relationshipX',
          'template1',
          'contentX',
          'inheritedX'
        ),
      ])
      .build();

    const diff = new TemplateDiff(base, updated);

    expect(diff.newRelationshipProps).toHaveLength(1);
    expect(diff.newRelationshipProps[0].id).toBe('rel_new');
  });

  it('should detect newly added generated id properties by type', () => {
    const base = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
      ])
      .build();

    const updated = TemplateBuilder.from(base)
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
        new GenerateIdProperty({
          id: 'gen1',
          label: 'Generated',
          template: 'template1',
        }),
      ])
      .build();

    const diff = new TemplateDiff(base, updated);

    expect(diff.newGeneratedIdProps).toHaveLength(1);
    expect(diff.newGeneratedIdProps[0].id).toBe('gen1');
    expect(diff.newGeneratedIdPropIds).toEqual(['gen1']);
  });

  it('should compute combined modifiedRelationshipPropIds', () => {
    const base = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'Connection',
          'relationship1',
          'template1',
          'content1',
          'inherited1'
        ),
      ])
      .build();

    const updated = TemplateBuilder.from(base)
      .withProperties([
        // rel1: V1-specific changed -> included
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'Connection',
          'relationship1_changed',
          'template1',
          'content1_changed',
          'inherited1_changed'
        ),
        // newly added relationship
        new V1RelationshipProperty(
          'rel_new',
          'connection2',
          'New rel',
          'relationshipX',
          'template1',
          'contentX',
          'inheritedX'
        ),
      ])
      .build();

    const diff = new TemplateDiff(base, updated);

    const ids = diff.modifiedRelationshipPropIds;
    expect(ids).toContain('rel1');
    expect(ids).toContain('rel_new');
  });

  it('hasAnyPostProcessChanges returns false when nothing relevant changed and true otherwise', () => {
    const base = TemplateBuilder.aTemplate({ id: 'template1', name: 'Template 1' })
      .withProperties([
        new Property({ id: 'p1', type: 'text', label: 'Title1', template: 'template1' }),
      ])
      .build();

    const same = TemplateBuilder.from(base).build();
    const diffSame = new TemplateDiff(base, same);
    expect(diffSame.hasAnyPostProcessChanges()).toBe(false);

    const withNewProp = TemplateBuilder.from(base)
      .withProperties([
        ...base.properties,
        new GenerateIdProperty({
          id: 'gen1',
          label: 'Generated',
          template: 'template1',
        }),
      ])
      .build();

    const diffWithGen = new TemplateDiff(base, withNewProp);
    expect(diffWithGen.hasAnyPostProcessChanges()).toBe(true);
  });
});
