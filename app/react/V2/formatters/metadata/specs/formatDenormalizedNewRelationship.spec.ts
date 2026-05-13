import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatDenormalizedNewRelationship } from '../formatDenormalizedNewRelationship.js';

const ids = {
  template: {
    incidentReport: '64b1636e2e6f8a001f9ad001',
  },
  property: {
    statusMultiselect: '64b1636e2e6f8a001f9ad010',
    composerRefsNewRel: '64b1636e2e6f8a001f9ad020',
    wrongTypeText: '64b1636e2e6f8a001f9ad099',
  },
  entity: {
    linkedSourceA: '64b1636e2e6f8a001f9ae001',
    linkedSourceB: '64b1636e2e6f8a001f9ae002',
  },
  thesaurus: {
    optionA: '64b1636e2e6f8a001f9af001',
    optionB: '64b1636e2e6f8a001f9af002',
    optionC: '64b1636e2e6f8a001f9af003',
  },
} as const;

describe('formatDenormalizedNewRelationship', () => {
  const templates = [
    {
      _id: ids.template.incidentReport,
      properties: [
        {
          _id: ids.property.statusMultiselect,
          name: 'status',
          label: 'Status',
          type: 'multiselect',
        },
      ],
    },
  ] as ClientTemplateSchema[];

  const entity = { template: ids.template.incidentReport } as Entity;

  it('returns null when not newRelationship or no denormalizedProperty', () => {
    const field = {
      _id: ids.property.wrongTypeText,
      name: 'x',
      label: 'X',
      type: 'relationship',
      denormalizedProperty: 'status',
    } as BaseMetadataProperty;

    expect(
      formatDenormalizedNewRelationship({
        field,
        metadata: {},
        entity,
        templates,
        entityTemplate: templates[0],
      })
    ).toBeNull();
  });

  it('returns null when denormalized name is not found on any template', () => {
    const field = {
      _id: ids.property.composerRefsNewRel,
      name: 'composer_refs',
      label: 'Refs',
      type: 'newRelationship',
      denormalizedProperty: 'missing_prop',
    } as BaseMetadataProperty;

    expect(
      formatDenormalizedNewRelationship({
        field,
        metadata: {
          composer_refs: [
            {
              value: ids.entity.linkedSourceA,
              inheritedValue: [{ value: ids.thesaurus.optionA, label: 'A' }],
            },
          ],
        } as Entity['metadata'],
        entity,
        templates,
        entityTemplate: templates[0],
      })
    ).toBeNull();
  });

  it('returns null when there is no inheritedValue data', () => {
    const field = {
      _id: ids.property.composerRefsNewRel,
      name: 'composer_refs',
      label: 'Refs',
      type: 'newRelationship',
      denormalizedProperty: 'status',
    } as BaseMetadataProperty;

    expect(
      formatDenormalizedNewRelationship({
        field,
        metadata: {
          composer_refs: [
            { value: ids.entity.linkedSourceA, label: 'Linked only (no inherited rows)' },
          ],
        } as Entity['metadata'],
        entity,
        templates,
        entityTemplate: templates[0],
      })
    ).toBeNull();
  });

  it('formats flattened inherited values with the denormalized property type', () => {
    const field = {
      _id: ids.property.composerRefsNewRel,
      name: 'composer_refs',
      label: 'Refs',
      type: 'newRelationship',
      denormalizedProperty: 'status',
    } as BaseMetadataProperty;

    const metadata = {
      composer_refs: [
        {
          value: ids.entity.linkedSourceA,
          label: 'Source entity A',
          inheritedValue: [
            { value: ids.thesaurus.optionA, label: 'Option A' },
            { value: ids.thesaurus.optionB, label: 'Option B' },
          ],
        },
        {
          value: ids.entity.linkedSourceB,
          label: 'Source entity B',
          inheritedValue: [{ value: ids.thesaurus.optionC, label: 'Option C' }],
        },
      ],
    } as Entity['metadata'];

    const result = formatDenormalizedNewRelationship({
      field,
      metadata,
      entity,
      templates,
      entityTemplate: templates[0],
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('multiselect');
    expect(result).toMatchObject({
      _id: ids.property.composerRefsNewRel,
      name: 'composer_refs',
      label: 'Refs',
      values: [
        { value: ids.thesaurus.optionA, label: 'Option A' },
        { value: ids.thesaurus.optionB, label: 'Option B' },
        { value: ids.thesaurus.optionC, label: 'Option C' },
      ],
    });
  });
});
