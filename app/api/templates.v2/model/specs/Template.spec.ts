import { Template } from '../Template';
import { Property } from '../Property';
import { V1RelationshipProperty } from '../V1RelationshipProperty';

describe('selectUpdatedProperties()', () => {
  it('should return information about properties that have changed', () => {
    const oldTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const newTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'New Title', 'template1'),
      new Property('prop2', 'text', 'description_updated', 'Description Updated', 'template1'),
    ]);

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(2);
    expect(updates[0]).toEqual({
      id: 'prop1',
      updatedAttributes: ['label'],
      oldProperty: oldTemplate.properties[0],
      newProperty: newTemplate.properties[0],
    });
    expect(updates[1]).toEqual({
      id: 'prop2',
      updatedAttributes: ['name', 'label'],
      oldProperty: oldTemplate.properties[1],
      newProperty: newTemplate.properties[1],
    });
  });

  it('should detect changes in V1RelationshipProperty specific attributes', () => {
    const templateWithRel1 = new Template('template1', 'Template 1', [
      new V1RelationshipProperty(
        'rel1',
        'connection',
        'Connection',
        'relationship1',
        'template1',
        'content1',
        'inherited1'
      ),
    ]);

    const templateWithRel2 = new Template('template1', 'Template 1', [
      new V1RelationshipProperty(
        'rel1',
        'connection',
        'Connection',
        'relationship2',
        'template1',
        'content2',
        'inherited2'
      ),
    ]);

    const updates = templateWithRel1.selectUpdatedProperties(templateWithRel2);

    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({
      id: 'rel1',
      updatedAttributes: ['relationType', 'content', 'inheritedPropertyId'],
      oldProperty: templateWithRel1.properties[0],
      newProperty: templateWithRel2.properties[0],
    });
  });

  it('should only return properties present in both templates', () => {
    const oldTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const newTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'New Title', 'template1'),
      new Property('prop3', 'text', 'new_prop', 'New Property', 'template1'),
    ]);

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('prop1');
  });

  it('should return empty array if no properties changed', () => {
    const oldTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const newTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(0);
  });
});

describe('selectRelationshipPropsWithRelationshipChanges()', () => {
  it('should return only V1 relationship properties that have V1-specific attributes changed', () => {
    const templateWithRel1 = new Template('template1', 'Template 1', [
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
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
    ]);

    const templateWithRel2 = new Template('template1', 'Template 1', [
      new V1RelationshipProperty(
        'rel1',
        'connection',
        'New Label', // only label changed (not a V1-specific property)
        'relationship1',
        'template1',
        'content1',
        'inherited1'
      ),
      new V1RelationshipProperty(
        'rel2',
        'connection2',
        'Connection2',
        'relationship2_changed', // relationType changed
        'template1',
        'content2_changed', // content changed
        'inherited2_changed' // inheritedPropertyId changed
      ),
      new Property('prop1', 'text', 'title', 'New Title', 'template1'),
    ]);

    const updates =
      templateWithRel1.selectRelationshipPropsWithRelationshipChanges(templateWithRel2);

    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({
      id: 'rel2',
      updatedAttributes: ['relationType', 'content', 'inheritedPropertyId'],
      oldProperty: templateWithRel1.properties[1],
      newProperty: templateWithRel2.properties[1],
    });
  });

  it('should return empty array when no V1-specific attributes changed', () => {
    const templateWithRel1 = new Template('template1', 'Template 1', [
      new V1RelationshipProperty(
        'rel1',
        'connection',
        'Connection',
        'relationship1',
        'template1',
        'content1',
        'inherited1'
      ),
    ]);

    const templateWithRel2 = new Template('template1', 'Template 1', [
      new V1RelationshipProperty(
        'rel1',
        'connection',
        'New Label', // only non-V1 property changed
        'relationship1',
        'template1',
        'content1',
        'inherited1'
      ),
    ]);

    const updates =
      templateWithRel1.selectRelationshipPropsWithRelationshipChanges(templateWithRel2);

    expect(updates).toHaveLength(0);
  });
});

describe('selectPropertiesWhereNameHasChanged()', () => {
  it('should return only properties where the name attribute has changed', () => {
    const templateWithProps1 = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
      new Property('prop3', 'text', 'summary', 'Summary', 'template1'),
    ]);

    const templateWithProps2 = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'New Title', 'template1'), // only label changed
      new Property('prop2', 'text', 'description_updated', 'Description', 'template1'), // name changed
      new Property('prop3', 'text', 'new_summary', 'New Summary', 'template1'), // both name and label changed
    ]);

    const updates = templateWithProps1.selectPropertiesWhereNameHasChanged(templateWithProps2);

    expect(updates).toHaveLength(2);
    expect(updates[0]).toEqual({
      id: 'prop2',
      updatedAttributes: ['name'],
      oldProperty: templateWithProps1.properties[1],
      newProperty: templateWithProps2.properties[1],
    });
    expect(updates[1]).toEqual({
      id: 'prop3',
      updatedAttributes: ['name', 'label'],
      oldProperty: templateWithProps1.properties[2],
      newProperty: templateWithProps2.properties[2],
    });
  });

  it('should return empty array when no name attributes changed', () => {
    const templateWithProps1 = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const templateWithProps2 = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'New Title', 'template1'), // only label changed
      new Property('prop2', 'text', 'description', 'New Description', 'template1'), // only label changed
    ]);

    const updates = templateWithProps1.selectPropertiesWhereNameHasChanged(templateWithProps2);

    expect(updates).toHaveLength(0);
  });
});

describe('selectDeletedProperties()', () => {
  it('should return properties that exist in old template but not in new template', () => {
    const oldTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
      new Property('prop3', 'text', 'summary', 'Summary', 'template1'),
    ]);

    const newTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      // prop2 deleted
      new Property('prop3', 'text', 'summary', 'New Summary', 'template1'),
    ]);

    const deletedProps = oldTemplate.selectDeletedProperties(newTemplate);

    expect(deletedProps).toHaveLength(1);
    expect(deletedProps[0]).toBe(oldTemplate.properties[1]); // prop2 was deleted
  });

  it('should return empty array when no properties were deleted', () => {
    const oldTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
    ]);

    const newTemplate = new Template('template1', 'Template 1', [
      new Property('prop1', 'text', 'title', 'New Title', 'template1'),
      new Property('prop2', 'text', 'description', 'Description', 'template1'),
      new Property('prop3', 'text', 'new_field', 'New Field', 'template1'),
    ]);

    const deletedProps = oldTemplate.selectDeletedProperties(newTemplate);

    expect(deletedProps).toHaveLength(0);
  });
});
