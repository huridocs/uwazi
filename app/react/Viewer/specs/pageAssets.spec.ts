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
    it('should return an intermediate entity', () => {
      const expectedEntityData = {
        title: 'Joker villian',
        sharedId: '8mdlvmt704q',
        creationDate: 1651458629899,
        editDate: 1651458929437,
        language: 'en',
        template: '626f4019389811b04456ab95',
        metadata: {
          character_description: [
            {
              value: 'Criminal mastermind',
              displayValue: 'Criminal mastermind',
              reference: {
                sharedId: 'ci03oddudli',
                type: 'inherit',
                property: 'description',
              },
            },
          ],
          main_enemy: [
            {
              value: 'Batman hero',
              displayValue: 'Batman hero',
              content: '626f3f85389811b04456a0cd',
              _id: '626f40f4389811b04456bc33',
              reference: [
                {
                  value: 'Batman hero',
                  url: '/entity/v5g098ioqe',
                  icon: null,
                  title: 'Batman hero',
                  sharedId: 'v5g098ioqe',
                  creationDate: 1651458822623,
                  template: '626f3f85389811b04456a0cd',
                  type: 'relationship',
                },
              ],
            },
          ],
          main_colors: [
            {
              value: 'Blue',
              displayValue: 'Blue',
              type: 'multiselect',
              content: '626f40c7389811b04456b5b5',
              _id: '626f4122389811b04456c2b4',
            },
            {
              value: 'Red',
              displayValue: 'Red',
              type: 'multiselect',
              content: '626f40c7389811b04456b5b5',
              _id: '626f4122389811b04456c2b4',
            },
          ],
          comic_dates: [
            {
              displayValue: 'Apr 2, 2018 ~ May 31, 2022',
              value: {
                from: 1522627200,
                to: 1654041599,
              },
              _id: '626f4341389811b04456d3c4',
              type: 'multidaterange',
            },
            {
              displayValue: 'May 15, 2013 ~ May 14, 2014',
              value: {
                from: 1368576000,
                to: 1400111999,
              },
              _id: '626f4341389811b04456d3c4',
              type: 'multidaterange',
            },
          ],
        },
      };
      expect(entityData).toEqual(expectedEntityData);
    });
    it('should transform the template from inmmutable to plain javascript', () => {
      expect(template).toEqual(dbTemplate.toJS());
    });
  });
});
