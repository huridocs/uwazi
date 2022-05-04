/* eslint-disable max-statements */
import { prepareAssets } from '../pageAssets';
import { dbEntity, dbTemplate, thesauri, expectedFormattedEntity } from './pageAssetsFixtures';

describe('pageAssets', () => {
  describe('prepareAssets', () => {
    const { entity, entityRaw, entityData, template } = prepareAssets(
      dbEntity,
      dbTemplate,
      thesauri
    );
    it('should return a raw entity', () => {
      expect(entityRaw).toEqual(dbEntity);
    });
    it('should return a formatted entity', () => {
      expect(entity).toEqual(expectedFormattedEntity);
    });

    it('should transform the template from inmmutable to plain javascript', () => {
      expect(template).toEqual(dbTemplate.toJS());
    });

    it.each`
      propertyName    | type           | displayValue                                 | value
      ${'text'}       | ${'text'}      | ${'one'}                                     | ${'one'}
      ${'numeric'}    | ${'numeric'}   | ${1}                                         | ${1}
      ${'select'}     | ${'select'}    | ${'Argentina'}                               | ${'f5t0ah6aluq'}
      ${'date'}       | ${'date'}      | ${'May 3, 2022'}                             | ${1651536000}
      ${'date_range'} | ${'daterange'} | ${'May 3, 2022 ~ May 4, 2022'}               | ${{ from: 1651536000, to: 1651708799 }}
      ${'image'}      | ${'image'}     | ${'/api/files/1651603234992smwovxz1mq.jpeg'} | ${'/api/files/1651603234992smwovxz1mq.jpeg'}
    `('should return $type properties formatted', ({ propertyName, type, displayValue, value }) => {
      expect(entityData.metadata[propertyName]).toEqual([
        {
          displayValue,
          value,
          type,
          name: propertyName,
        },
      ]);
    });
    it('should return multi select properties formatted', () => {
      expect(entityData.metadata.multi_select).toEqual([
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

    it('should return geolocation properties formatted', () => {
      expect(entityData.metadata.geolocation_geolocation).toEqual([
        {
          value: { lat: 46.660244945286394, lon: 8.283691406250002, label: '' },
          displayValue: { lat: 46.660244945286394, lon: 8.283691406250002, label: '' },
          type: 'geolocation',
          name: 'geolocation_geolocation',
        },
      ]);
    });
    it('should return multi date range properties formatted', () => {
      expect(entityData.metadata.multi_date_range).toEqual([
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
      expect(entityData.metadata.relationship).toEqual([
        {
          name: 'relationship',
          type: 'relationship',
          value: 'zse9gkdu27',
          displayValue: 'Test 5',
          reference: {
            sharedId: 'zse9gkdu27',
            creationDate: 1651251547653,
            title: 'Test 5',
            template: '626c19238a46c11701b49a55',
          },
        },
      ]);
    });
  });
});
