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
    xit('should return a formatted entity', () => {
      expect(entity).toEqual(expectedFormattedEntity);
    });

    it('should transform the template from inmmutable to plain javascript', () => {
      expect(template).toEqual(dbTemplate.toJS());
    });
    it('should return text properties formatted', () => {
      expect(entityData.metadata.text).toEqual([
        { displayValue: 'one', value: 'one', type: 'text', name: 'text' },
      ]);
    });
    it('should return numeric properties formatted', () => {
      expect(entityData.metadata.numeric).toEqual([
        { displayValue: 1, value: 1, type: 'numeric', name: 'numeric' },
      ]);
    });
    it('should return select properties formatted', () => {
      expect(entityData.metadata.select).toEqual([
        { displayValue: 'Argentina', value: 'f5t0ah6aluq', type: 'select', name: 'select' },
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
    it('should return date properties formatted', () => {
      expect(entityData.metadata.date).toEqual([
        {
          value: 1651536000,
          displayValue: 'May 3, 2022',
          type: 'date',
          name: 'date',
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
  });
});
