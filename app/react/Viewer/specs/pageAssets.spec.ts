import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { prepareAssets } from '../pageAssets';
import {
  dbEntity,
  dbTemplates,
  thesauris,
  expectedFormattedEntity,
} from './fixtures/pageAssets/pageAssets';
import {
  otherEntities,
  relationTypes,
  templatesForAggregations,
  thesaurisForAggregations,
  entityData1RelationsAggregations,
  entityData2RelationsAggregations,
  entityData4RelationsAggregations,
  entityData5RelationsAggregations,
  DocumentWithRelationsTemplate,
  OtherDocumentWithRelations,
  myTemplate,
  inheritingDocument,
  myEntity,
} from './fixtures/pageAssets/relationsAggregations';

describe('pageAssets', () => {
  describe('prepareAssets', () => {
    let entity: EntitySchema;
    let entityRaw: EntitySchema;
    let entityData: EntitySchema;
    let template: TemplateSchema;

    beforeAll(() => {
      ({ entity, entityRaw, entityData, template } = prepareAssets(
        dbEntity,
        dbTemplates.get(0),
        {
          templates: dbTemplates,
          thesauris,
        },
        []
      ));
    });

    it('should return a raw entity', () => {
      expect(entityRaw).toEqual(dbEntity);
    });

    it('should return a formatted entity', () => {
      expect(entity).toEqual(expectedFormattedEntity);
    });

    it('should transform the template from inmmutable to plain javascript', () => {
      expect(template).toEqual(dbTemplates.get(0).toJS());
    });

    describe('entityData', () => {
      it.each`
        propertyName    | type           | displayValue                                 | value
        ${'text'}       | ${'text'}      | ${'one'}                                     | ${'one'}
        ${'numeric'}    | ${'numeric'}   | ${1}                                         | ${1}
        ${'select'}     | ${'select'}    | ${'Argentina'}                               | ${'f5t0ah6aluq'}
        ${'date'}       | ${'date'}      | ${'May 3, 2022'}                             | ${1651536000}
        ${'date_range'} | ${'daterange'} | ${'May 3, 2022 ~ May 4, 2022'}               | ${{ from: 1651536000, to: 1651708799 }}
        ${'image'}      | ${'image'}     | ${'/api/files/1651603234992smwovxz1mq.jpeg'} | ${'/api/files/1651603234992smwovxz1mq.jpeg'}
        ${'rich_text'}  | ${'markdown'}  | ${'# one\n\n## two\n\n### three'}            | ${'# one\n\n## two\n\n### three'}
      `(
        'should return $type properties formatted',
        ({ propertyName, type, displayValue, value }) => {
          expect(entityData.metadata?.[propertyName]).toEqual([
            {
              displayValue,
              value,
              type,
              name: propertyName,
            },
          ]);
        }
      );

      it('should return multi select properties formatted', () => {
        expect(entityData.metadata?.multi_select).toEqual([
          {
            value: 'f5t0ah6aluq',
            displayValue: 'Argentina',
            type: 'multiselect',
            name: 'multi_select',
          },
          {
            value: 'k9vqx1bkkso',
            displayValue: 'Colombia',
            type: 'multiselect',
            name: 'multi_select',
          },
        ]);
      });

      it('should return multi date properties formatted', () => {
        expect(entityData.metadata?.multi_date).toEqual([
          {
            value: 1651622400,
            displayValue: 'May 4, 2022',
            type: 'multidate',
            name: 'multi_date',
          },
          {
            value: 1651708800,
            displayValue: 'May 5, 2022',
            type: 'multidate',
            name: 'multi_date',
          },
        ]);
      });

      it('should return link properties formatted', () => {
        expect(entityData.metadata?.link).toEqual([
          {
            displayValue: { label: 'test', url: 'https://google.com' },
            value: { label: 'test', url: 'https://google.com' },
            type: 'link',
            name: 'link',
          },
        ]);
      });

      it('should return geolocation properties formatted', () => {
        expect(entityData.metadata?.geolocation_geolocation).toEqual([
          {
            value: { lat: 46.660244945286394, lon: 8.283691406250002, label: '' },
            displayValue: { lat: 46.660244945286394, lon: 8.283691406250002, label: '' },
            type: 'geolocation',
            name: 'geolocation_geolocation',
          },
        ]);
      });

      it('should return multi date range properties formatted', () => {
        expect(entityData.metadata?.multi_date_range).toEqual([
          {
            displayValue: 'May 8, 2022 ~ May 13, 2022',
            name: 'multi_date_range',
            type: 'multidaterange',
            value: { from: 1651968000, to: 1652486399 },
          },
          {
            displayValue: 'May 15, 2022 ~ May 20, 2022',
            name: 'multi_date_range',
            type: 'multidaterange',
            value: { from: 1652572800, to: 1653091199 },
          },
        ]);
      });

      it('should return relationship properties formatted', () => {
        expect(entityData.metadata?.relationship).toEqual([
          {
            name: 'relationship',
            type: 'inherit',
            value: 'e9oxs8zgyc9',
            displayValue: 'Test 6',
            reference: {
              sharedId: 'e9oxs8zgyc9',
              creationDate: 1651694673470,
              title: 'Test 6',
              template: '6272dc3e4c077e92cc2b72ed',
              inheritedProperty: 'title',
            },
          },
        ]);
      });

      it('should return inhertied relationship properties formatted', () => {
        expect(entityData.metadata?.inherit).toEqual([
          {
            name: 'inherit',
            type: 'inherit',
            value: 1650412800,
            displayValue: 'Apr 20, 2022',
            reference: {
              sharedId: 'zse9gkdu27',
              creationDate: 1651251547653,
              title: 'Test 5',
              template: '626c19238a46c11701b49a55',
              inheritedProperty: 'date',
            },
          },
        ]);
      });

      it('should work when metadata value is not set', () => {
        expect(entityData.metadata?.emptyText).toEqual([
          {
            name: 'emptyText',
            type: 'text',
            value: undefined,
            displayValue: undefined,
          },
        ]);
        expect(entityData.metadata?.emptyRelation).toEqual([
          {
            name: 'emptyRelation',
            type: 'inherit',
            value: [],
            displayValue: [],
          },
        ]);
      });
    });
  });

  describe('aggregated relations data', () => {
    it('should contain a inherited_relationships entry for every multi-inherit type', () => {
      const [entityData1, entityData2, entityData3] = otherEntities.map(rawEntity => {
        const { entityData: result } = prepareAssets(
          rawEntity,
          DocumentWithRelationsTemplate,
          {
            templates: templatesForAggregations,
            thesauris: thesaurisForAggregations,
          },
          relationTypes
        );
        return result;
      });

      expect(entityData1.inherited_relationships).toEqual(entityData1RelationsAggregations);

      expect(entityData2.inherited_relationships).toEqual(entityData2RelationsAggregations);

      expect(entityData3.inherited_relationships).toEqual({});
    });

    it('should separte same type of relations by template and only aggregate inherited metadata', () => {
      const { entityData } = prepareAssets(
        inheritingDocument,
        OtherDocumentWithRelations,
        {
          templates: templatesForAggregations,
          thesauris: thesaurisForAggregations,
        },
        relationTypes
      );
      expect(entityData.inherited_relationships).toEqual(entityData4RelationsAggregations);
    });

    it('should exclude relations that are not part of the metadata', () => {
      const { entityData } = prepareAssets(
        myEntity,
        myTemplate,
        {
          templates: templatesForAggregations,
          thesauris: thesaurisForAggregations,
        },
        relationTypes
      );
      expect(entityData.inherited_relationships).toEqual(entityData5RelationsAggregations);
    });
  });
});
