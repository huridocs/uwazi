import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { MultiLanguageEntityDataSource } from '#api/core/application/contracts/MultiLanguageEntitiesDataSource.js';
import {
  ANY_TEMPLATE_RELATIONSHIP_KEY,
  buildRelationshipAppliedValues,
  collectRelationshipTitlesFromRows,
} from '../CsvPreflightRelationshipsService.js';

describe('CsvPreflightRelationshipsService', () => {
  it('should collect titles for constrained and any-template relationships', () => {
    const template = TemplateBuilder.aTemplate({
      id: 'template',
      properties: [
        new V1RelationshipProperty(
          'p1',
          'rel_constrained',
          'Rel A',
          'rel_constrained',
          'template',
          't1'
        ),
        new V1RelationshipProperty('p2', 'rel_any', 'Rel B', 'rel_any', 'template', ''),
      ],
    }).build();

    const titlesByTemplate = collectRelationshipTitlesFromRows({
      template,
      sanitizedHeaders: ['rel_constrained', 'rel_any'],
      rows: [{ values: ['Alpha|Beta', 'Gamma|Delta'] }],
    });

    expect(Array.from(titlesByTemplate.get('t1') || [])).toEqual(['Alpha', 'Beta']);
    expect(Array.from(titlesByTemplate.get(ANY_TEMPLATE_RELATIONSHIP_KEY) || [])).toEqual([
      'Gamma',
      'Delta',
    ]);
  });

  it('should build applied values with ambiguous and not-found candidates', async () => {
    const entitiesDS = TestUtils.mockClass<MultiLanguageEntityDataSource>({
      getSharedIdsByTemplateAndTitles: jest.fn().mockResolvedValue([
        { title: 'Duplicate', sharedId: 'shared-1' },
        { title: 'Duplicate', sharedId: 'shared-2' },
      ]),
      getSharedIdsByTitles: jest
        .fn()
        .mockResolvedValue([{ title: 'FoundAny', sharedId: 'shared-3', templateId: 'tpl-any' }]),
    }) as unknown as MultiLanguageEntityDataSource;

    const docs = await buildRelationshipAppliedValues({
      entitiesDS,
      importId: 'import-id',
      chunkSize: 10,
      titlesByTemplate: new Map<string, Set<string>>([
        ['target-template', new Set(['Duplicate', 'Missing'])],
        [ANY_TEMPLATE_RELATIONSHIP_KEY, new Set(['FoundAny'])],
      ]),
    });

    const constrainedDoc = docs.find(doc => doc.templateId === 'target-template');
    const anyDoc = docs.find(doc => doc.templateId === ANY_TEMPLATE_RELATIONSHIP_KEY);

    expect(constrainedDoc?.values).toEqual([
      {
        label: 'Duplicate',
        matches: [
          { sharedId: 'shared-1', templateId: 'target-template' },
          { sharedId: 'shared-2', templateId: 'target-template' },
        ],
      },
      {
        label: 'Missing',
        matches: [],
      },
    ]);
    expect(anyDoc?.values).toEqual([
      {
        label: 'FoundAny',
        matches: [{ sharedId: 'shared-3', templateId: 'tpl-any' }],
      },
    ]);
  });
});
