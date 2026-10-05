import { SettingsDiff } from '../SettingsDiff.js';

describe('SettingsDiff', () => {
  describe('between()', () => {
    it('should list the top-level fields that changed, sorted', () => {
      expect(
        SettingsDiff.between(
          { site_name: 'Before', private: false, filters: [{ id: '1', name: 'A' }] },
          { site_name: 'After', private: false, filters: [{ id: '1', name: 'B' }] }
        )
      ).toEqual({ keys: ['filters', 'site_name'] });
    });

    it('should count a field that appeared or disappeared', () => {
      expect(SettingsDiff.between({ customCSS: 'a' }, { dateFormat: 'yyyy' })).toEqual({
        keys: ['customCSS', 'dateFormat'],
      });
    });

    it('should compare nested values structurally, not by reference', () => {
      expect(
        SettingsDiff.between(
          { languages: [{ key: 'en', label: 'English' }] },
          {
            languages: [{ key: 'en', label: 'English' }],
          }
        )
      ).toEqual({ keys: [] });
    });

    it('should ignore identity and version fields', () => {
      expect(SettingsDiff.between({ _id: 'a', __v: 1 }, { _id: 'b', __v: 2 })).toEqual({
        keys: [],
      });
    });

    it('should name the features switched on and off', () => {
      expect(
        SettingsDiff.between(
          { features: { ocr: { url: 'http://ocr' }, topicClassification: true } },
          { features: { segmentation: { url: 'http://seg' }, topicClassification: false } }
        )
      ).toEqual({
        keys: ['features'],
        features: { enabled: ['segmentation'], disabled: ['ocr', 'topicClassification'] },
      });
    });

    it('should treat features appearing with the whole object as switched on', () => {
      expect(
        SettingsDiff.between({}, { features: { segmentation: { url: 'http://seg' } } })
      ).toEqual({
        keys: ['features'],
        features: { enabled: ['segmentation'], disabled: [] },
      });
    });

    it('should leave features out when only their configuration changed', () => {
      expect(
        SettingsDiff.between(
          { features: { segmentation: { url: 'http://old' } } },
          { features: { segmentation: { url: 'http://new' } } }
        )
      ).toEqual({ keys: ['features'] });
    });

    it('should never carry feature configuration, which may hold credentials', () => {
      const changes = SettingsDiff.between(
        {},
        { features: { segmentation: { url: 'http://user:secret@seg' } } }
      );

      expect(JSON.stringify(changes)).not.toContain('secret');
    });
  });
});
