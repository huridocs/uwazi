import { TextProperty } from 'api/core/domain/template/TextProperty';
import {
  DefaultTemplateConflictError,
  TemplateWithDuplicatedPropertyError,
  TemplateWithMissingCommonProperty,
} from 'api/core/domain/template/errors';
import { TitleProperty } from 'api/core/domain/template/TitleProperty';
import { CreationDateProperty } from 'api/core/domain/template/CreationDateProperty';
import { ModifiedDateProperty } from 'api/core/domain/template/ModifiedDateProperty';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { Template } from '../Template';
import { Property } from '../Property';
import { V1RelationshipProperty } from '../V1RelationshipProperty';

describe('selectUpdatedProperties()', () => {
  it('should return information about properties that have changed', () => {
    const oldTemplate = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title Edited 1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          label: 'Description Updated',
          template: 'template1',
        }),
      ])
      .build();

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(2);
    expect(updates[0]).toEqual({
      id: 'prop1',
      updatedAttributes: ['name', 'label'],
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
    const templateWithRel1 = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
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

    const templateWithRel2 = TemplateBuilder.from(templateWithRel1)
      .withProperties([
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'Connection',
          'relationship2',
          'template1',
          'content2',
          'inherited2'
        ),
      ])
      .build();

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
    const oldTemplate = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'New Title',
          template: 'template1',
        }),
        new Property({
          id: 'prop3',
          type: 'text',
          label: 'New Property',
          template: 'template1',
        }),
      ])
      .build();

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('prop1');
  });

  it('should return empty array if no properties changed', () => {
    const oldTemplate = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate).build();

    const updates = oldTemplate.selectUpdatedProperties(newTemplate);

    expect(updates).toHaveLength(0);
  });
});

describe('selectRelationshipPropsWithRelationshipChanges()', () => {
  it('should return only V1 relationship properties that have V1-specific attributes changed', () => {
    const templateWithRel1 = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
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
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
      ])
      .build();

    const templateWithRel2 = TemplateBuilder.from(templateWithRel1)
      .withProperties([
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
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'New Title',
          template: 'template1',
        }),
      ])
      .build();

    const updates =
      templateWithRel1.selectRelationshipPropsWithRelationshipChanges(templateWithRel2);

    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(templateWithRel2.properties[1]);
  });

  it('should return empty array when no V1-specific attributes changed', () => {
    const templateWithRel1 = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
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

    const templateWithRel2 = TemplateBuilder.from(templateWithRel1)
      .withProperties([
        new V1RelationshipProperty(
          'rel1',
          'connection',
          'New Label', // only non-V1 property changed
          'relationship1',
          'template1',
          'content1',
          'inherited1'
        ),
      ])
      .build();

    const updates =
      templateWithRel1.selectRelationshipPropsWithRelationshipChanges(templateWithRel2);

    expect(updates).toHaveLength(0);
  });
});

describe('selectPropertiesWhereNameHasChanged()', () => {
  it('should return only properties where the name attribute has changed', () => {
    const templateWithProps1 = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title 1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description',
          label: 'Description',
          template: 'template1',
        }),
        new Property({
          id: 'prop3',
          type: 'text',
          name: 'summary',
          label: 'Summary',
          template: 'template1',
        }),
      ])
      .build();

    const templateWithProps2 = TemplateBuilder.from(templateWithProps1)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          name: 'title_1',
          label: 'New Title',
          template: 'template1',
        }), // only label changed
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description_updated',
          label: 'Description',
          template: 'template1',
        }), // name changed
        new Property({
          id: 'prop3',
          type: 'text',
          name: 'new_summary',
          label: 'New Summary',
          template: 'template1',
        }), // both name and label changed
      ])
      .build();

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
    const templateWithProps1 = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const templateWithProps2 = TemplateBuilder.from(templateWithProps1)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          name: 'title1',
          label: 'New Title',
          template: 'template1',
        }), // only label changed
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description',
          label: 'New Description',
          template: 'template1',
        }), // only label changed
      ])
      .build();

    const updates = templateWithProps1.selectPropertiesWhereNameHasChanged(templateWithProps2);

    expect(updates).toHaveLength(0);
  });
});

describe('selectDeletedProperties()', () => {
  it('should return properties that exist in old template but not in new template', () => {
    const oldTemplate = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          name: 'description',
          label: 'Description',
          template: 'template1',
        }),
        new Property({
          id: 'prop3',
          type: 'text',
          name: 'summary',
          label: 'Summary',
          template: 'template1',
        }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title1',
          template: 'template1',
        }),
        // prop2 deleted
        new Property({
          id: 'prop3',
          type: 'text',
          name: 'summary',
          label: 'New Summary',
          template: 'template1',
        }),
      ])
      .build();

    const deletedProps = oldTemplate.selectDeletedProperties(newTemplate);

    expect(deletedProps).toHaveLength(1);
    expect(deletedProps[0]).toBe(oldTemplate.properties[1]); // prop2 was deleted
  });

  it('should return empty array when no properties were deleted', () => {
    const oldTemplate = TemplateBuilder.aTemplate({
      id: 'template1',
      name: 'Template 1',
    })
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'Title1',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
      ])
      .build();

    const newTemplate = TemplateBuilder.from(oldTemplate)
      .withProperties([
        new Property({
          id: 'prop1',
          type: 'text',
          label: 'New Title',
          template: 'template1',
        }),
        new Property({
          id: 'prop2',
          type: 'text',
          label: 'Description',
          template: 'template1',
        }),
        new Property({
          id: 'prop3',
          type: 'text',
          label: 'New Field',
          template: 'template1',
        }),
      ])
      .build();

    const deletedProps = oldTemplate.selectDeletedProperties(newTemplate);

    expect(deletedProps).toHaveLength(0);
  });
});

xit('should throw if there are duplicated Properties', () => {
  expect(
    () =>
      new Template(
        'id',
        'name',
        [
          new TextProperty({ id: 'id', label: 'text', template: 'template' }),
          new TextProperty({ id: 'id', label: 'text', template: 'template' }),
        ],
        [
          new TitleProperty({ id: '', template: '', label: 'A text label' }),
          new CreationDateProperty({ id: '', template: '', label: 'A Creation date label' }),
          new ModifiedDateProperty({ id: '', template: '', label: 'A Modified date label' }),
        ],
        'template'
      )
  ).toThrow(TemplateWithDuplicatedPropertyError);

  expect(
    () =>
      new Template(
        'id',
        'name',
        [new TextProperty({ id: 'id', label: 'text', name: 'title', template: 'template' })],
        [
          new TitleProperty({ id: '', template: '', label: 'A text label' }),
          new CreationDateProperty({ id: '', template: '', label: 'A Creation date label' }),
          new ModifiedDateProperty({ id: '', template: '', label: 'A Modified date label' }),
        ],
        'template'
      )
  ).toThrow(TemplateWithDuplicatedPropertyError);

  expect(
    () =>
      new Template(
        'id',
        'name',
        [],
        [
          new TitleProperty({ id: 'id', label: 'text', template: 'template' }),
          new TitleProperty({ id: 'id', label: 'text', template: 'template' }),
        ],
        'template'
      )
  ).toThrow(TemplateWithDuplicatedPropertyError);
});

xit('should throw if there are no CommonProperties', () => {
  expect(() => new Template('id', 'name', [], [], 'template')).toThrow(
    TemplateWithMissingCommonProperty
  );

  expect(
    () =>
      new Template(
        'id',
        'name',
        [],
        [new TitleProperty({ id: '', template: '', label: 'A text label' })],
        'template'
      )
  ).toThrow(TemplateWithMissingCommonProperty);

  expect(
    () =>
      new Template(
        'id',
        'name',
        [],
        [
          new TitleProperty({ id: '', template: '', label: 'A text label' }),
          new CreationDateProperty({ id: '', template: '', label: 'A Creation date label' }),
        ],
        'template'
      )
  ).toThrow(TemplateWithMissingCommonProperty);

  expect(
    () =>
      new Template(
        'id',
        'name',
        [],
        [
          new TitleProperty({ id: '', template: '', label: 'A text label' }),
          new CreationDateProperty({ id: '', template: '', label: 'A Creation date label' }),
          new ModifiedDateProperty({ id: '', template: '', label: 'A Modified date label' }),
        ],
        'template'
      )
  ).not.toThrow();
});

it('should set as default Template', () => {
  const existingDefault = TemplateBuilder.aTemplate({
    name: 'Existing Default',
    isDefault: true,
  }).build();

  const toDefault = TemplateBuilder.aTemplate({
    name: 'To Default',
    isDefault: false,
  }).build();

  toDefault.setAsDefault(existingDefault);

  expect(toDefault.isDefault).toBe(true);
  expect(existingDefault.isDefault).toBe(false);
});

it('should throw when trying to swap default with a non-default Template', () => {
  const nonDefault = TemplateBuilder.aTemplate({
    name: 'Non Default',
    isDefault: false,
  }).build();

  const toDefault = TemplateBuilder.aTemplate({
    name: 'To Default',
    isDefault: false,
  }).build();

  expect(() => toDefault.setAsDefault(nonDefault)).toThrow(DefaultTemplateConflictError);
});

it('should throw if Template is already default', () => {
  const existingDefault = TemplateBuilder.aTemplate({
    name: 'existingDefault',
    isDefault: true,
  }).build();

  expect(() => existingDefault.setAsDefault(existingDefault)).toThrow(DefaultTemplateConflictError);
});
