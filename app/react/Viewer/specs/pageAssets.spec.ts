import { prepareAssets } from '../pageAssets';
import { entityRaw, template, thesauri } from './pageAssetsFixtures';

describe('pageAssets', () => {
  describe('prepareAssets', () => {
    it('should return the expected object', () => {
      const entityExpected = {
        title: 'Joker villian',
        sharedId: '8mdlvmt704q',
        creationDate: 1651458629899,
        editDate: 1651458929437,
        language: 'en',
        template: '626f4019389811b04456ab95',
        metadata: [
          {
            character_description: {
              name: 'character_description',
              label: 'Character description',
              type: 'inherit',
              value: [
                {
                  value: 'Criminal mastermind',
                },
              ],
            },
          },
          {
            main_enemy: {
              name: 'main_enemy',
              label: 'Main enemy',
              content: '626f3f85389811b04456a0cd',
              _id: '626f40f4389811b04456bc33',
              type: 'relationship',
              value: [
                {
                  value: 'Batman hero',
                  url: '/entity/v5g098ioqe',
                  icon: null,
                  title: 'Batman hero',
                  sharedId: 'v5g098ioqe',
                  creationDate: 1651458822623,
                  template: '626f3f85389811b04456a0cd',
                },
              ],
            },
          },
          {
            main_colors: {
              name: 'main_colors',
              label: 'Main colors',
              content: '626f40c7389811b04456b5b5',
              _id: '626f4122389811b04456c2b4',
              type: 'multiselect',
              value: [
                {
                  value: 'Blue',
                },
                {
                  value: 'Red',
                },
              ],
            },
          },
          {
            comic_dates: {
              name: 'comic_dates',
              label: 'Comic dates',
              _id: '626f4341389811b04456d3c4',
              type: 'multidaterange',
              value: [
                {
                  value: 'Apr 2, 2018 ~ May 31, 2022',
                },
                {
                  value: 'May 15, 2013 ~ May 14, 2014',
                },
              ],
            },
          },
        ],
      };
      const { entity } = prepareAssets(entityRaw, template, thesauri);
      expect(entity).toEqual(entityExpected);
    });
  });
});
