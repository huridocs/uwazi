import { Translation } from '../Translation.js';
import { TranslationContextModel } from '../TranslationContextModel.js';

describe('TranslationContextModel', () => {
  type ContextType = 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';

  const createContext = (id: string, label: string, type: ContextType = 'Entity') => ({
    id,
    label,
    type,
  });
  const translation = (
    key: string,
    value: string,
    lang: string,
    context: ReturnType<typeof createContext>
  ) => new Translation(key, value, lang as any, context);

  const langs = ['en' as any, 'es' as any, 'fr' as any];
  const defaultLang = 'en' as any;

  const createModel = (
    context: ReturnType<typeof createContext>,
    translations: Translation[] = []
  ) => TranslationContextModel.create(context, translations, langs, defaultLang);

  const expectKey = (model: TranslationContextModel, key: string, lang: string, value?: string) => {
    const translationToCheck = model
      .getAllTranslations()
      .find(t => t.key === key && t.language === lang);

    expect(translationToCheck?.value).toBe(value);
  };

  describe('Factory and Initialization', () => {
    it('should create model with existing translations and preserve state', () => {
      const context = createContext('ctx1', 'Test');
      const translations = [
        translation('Name', 'Name', 'en', context),
        translation('Name', 'Nombre', 'es', context),
      ];

      const model = createModel(context, translations);

      expect(model.getAllTranslations()).toHaveLength(2);
      expectKey(model, 'Name', 'en', 'Name');
      expectKey(model, 'Name', 'es', 'Nombre');
      expect(model.getDiff().hasChanges()).toBe(false);
    });

    it('should create empty model for new context', () => {
      const model = createModel(createContext('ctx1', 'New'));

      expect(model.getAllTranslations()).toHaveLength(0);
      expect(model.hasChanges()).toBe(false);
    });
  });

  describe('Context Label Tracking', () => {
    it('should extract original label from existing translations, not from contextInfo', () => {
      const originalCtx = createContext('ctx1', 'System', 'Uwazi UI');
      const translations = [translation('Password', 'Password', 'en', originalCtx)];
      const newCtx = createContext('ctx1', 'Interface', 'Uwazi UI');

      const model = createModel(newCtx, translations);

      expect(model.getDiff().contextLabelChanged).toBe(true);
      expect(model.getContextInfo().label).toBe('Interface');
    });

    it('should detect label changes and include in hasChanges', () => {
      const model = createModel(createContext('ctx1', 'NewLabel'), [
        translation('Key', 'Value', 'en', createContext('ctx1', 'OldLabel')),
      ]);

      expect(model.getDiff().contextLabelChanged).toBe(true);
      expect(model.hasChanges()).toBe(true);
    });

    it('should use contextInfo label as original for new contexts', () => {
      const model = createModel(createContext('ctx1', 'New'));
      model.applyChanges({}, { Key: 'Key' }, []);

      expect(model.getDiff().contextLabelChanged).toBe(false);
    });

    it('should report no change when labels match', () => {
      const context = createContext('ctx1', 'Same');
      const model = createModel(context, [translation('Key', 'Value', 'en', context)]);

      expect(model.getDiff().contextLabelChanged).toBe(false);
    });
  });

  describe('Key Rename Operations', () => {
    it('should rename key and preserve translations in all languages', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('OldName', 'OldName', 'en', context),
        translation('OldName', 'Nombre Viejo', 'es', context),
        translation('OldName', 'Ancien Nom', 'fr', context),
      ]);

      model.applyChanges({ OldName: 'NewName' }, { NewName: 'NewName' }, []);

      expectKey(model, 'NewName', 'en', 'NewName');
      expectKey(model, 'NewName', 'es', 'Nombre Viejo');
      expectKey(model, 'NewName', 'fr', 'Ancien Nom');
      expectKey(model, 'OldName', 'en');
    });

    it('should update default language value to match new key name', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('age', 'age', 'en', context),
        translation('age', 'edad', 'es', context),
      ]);

      model.applyChanges({ age: 'Age' }, { Age: 'Age' }, []);

      expectKey(model, 'Age', 'en', 'Age');
      expectKey(model, 'Age', 'es', 'edad');
    });

    it('should handle no-op rename without changes', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [translation('Name', 'Name', 'en', context)]);

      model.applyChanges({ Name: 'Name' }, { Name: 'Name' }, []);

      expect(model.hasChanges()).toBe(false);
    });

    it('should skip rename to existing key but delete old key if unprotected', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('Name', 'Name', 'en', context),
        translation('Name', 'Nombre', 'es', context),
        translation('Title', 'Title', 'en', context),
        translation('Title', 'Título', 'es', context),
      ]);

      model.applyChanges({ Name: 'Title' }, { Title: 'Title' }, []);

      expectKey(model, 'Title', 'es', 'Título');
      expectKey(model, 'Name', 'en');
      expectKey(model, 'Name', 'es');
    });

    it('should handle multiple-to-one rename by creating fresh translations', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('KeyA', 'KeyA', 'en', context),
        translation('KeyA', 'Clave A', 'es', context),
        translation('KeyB', 'KeyB', 'en', context),
      ]);

      model.applyChanges({ KeyA: 'Merged', KeyB: 'Merged' }, { Merged: 'Merged' }, []);

      expectKey(model, 'Merged', 'en', 'Merged');
      expectKey(model, 'Merged', 'es', 'Merged');
      expectKey(model, 'Merged', 'fr', 'Merged');
    });

    it('should prevent rename when old key is in valueChanges', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [translation('Old', 'Old', 'en', context)]);

      model.applyChanges({ Old: 'New' }, { Old: 'Old', New: 'New' }, []);

      expectKey(model, 'Old', 'en', 'Old');
      expectKey(model, 'New', 'en', 'New');
    });
  });

  describe('Key Deletion', () => {
    it('should delete keys in keysToDelete but never keys in valueChanges', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('ToDelete', 'ToDelete', 'en', context),
        translation('Protected', 'Protected', 'en', context),
        translation('Keep', 'Keep', 'en', context),
      ]);

      model.applyChanges({}, { Protected: 'Protected' }, ['ToDelete', 'Protected']);

      expectKey(model, 'ToDelete', 'en');
      expectKey(model, 'Protected', 'en', 'Protected');
      expectKey(model, 'Keep', 'en', 'Keep');
    });

    it('should delete old key after rename unless protected', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [translation('Old', 'Old', 'en', context)]);

      model.applyChanges({ Old: 'New' }, { New: 'New' }, []);

      expectKey(model, 'Old', 'en');
      expectKey(model, 'New', 'en', 'New');
    });

    it('should handle multiple deletion scenarios', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('Key1', 'Key1', 'en', context),
        translation('Key2', 'Key2', 'en', context),
        translation('Key3', 'Key3', 'en', context),
        translation('Key4', 'Key4', 'en', context),
      ]);

      model.applyChanges({ Key2: 'Renamed' }, { Renamed: 'Renamed' }, ['Key3']);

      expectKey(model, 'Key1', 'en', 'Key1');
      expectKey(model, 'Key2', 'en');
      expectKey(model, 'Renamed', 'en', 'Renamed');
      expectKey(model, 'Key3', 'en');
      expectKey(model, 'Key4', 'en', 'Key4');
    });
  });

  describe('Key Creation', () => {
    it('should create missing keys for all languages', () => {
      const model = createModel(createContext('ctx1', 'Test'));

      model.applyChanges({}, { NewKey: 'NewKey', Another: 'Another' }, []);

      expectKey(model, 'NewKey', 'en', 'NewKey');
      expectKey(model, 'NewKey', 'es', 'NewKey');
      expectKey(model, 'NewKey', 'fr', 'NewKey');
      expectKey(model, 'Another', 'en', 'Another');
    });

    it('should not overwrite existing keys', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('Existing', 'Existing', 'en', context),
        translation('Existing', 'Existente', 'es', context),
      ]);

      model.applyChanges({}, { Existing: 'Existing', New: 'New' }, []);

      expectKey(model, 'Existing', 'es', 'Existente');
      expectKey(model, 'New', 'en', 'New');
    });
  });

  describe('Diff Calculation', () => {
    it('should detect added translations', () => {
      const model = createModel(createContext('ctx1', 'Test'));
      model.applyChanges({}, { New: 'New' }, []);

      const diff = model.getDiff();

      expect(diff.addedTranslations.length).toBeGreaterThan(0);
      expect(diff.addedTranslations.map(t => t.key)).toContain('New');
    });

    it('should detect added and deleted on rename', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [translation('Old', 'Old', 'en', context)]);

      model.applyChanges({ Old: 'New' }, { New: 'New' }, []);

      const diff = model.getDiff();
      expect(diff.addedTranslations.some(t => t.key === 'New')).toBe(true);
      expect(diff.deletedKeys).toContain('Old');
    });

    it('should detect updated translation when value changes', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [translation('Name', 'Name', 'en', context)]);

      const langMap = (model as any).translations.get('Name');
      langMap?.set('en' as any, new Translation('Name', 'NewValue', 'en' as any, context));

      expect(model.getDiff().updatedTranslations.some(t => t.value === 'NewValue')).toBe(true);
    });

    it('should detect deletions and label changes', () => {
      const oldCtx = createContext('ctx1', 'Old');
      const newCtx = createContext('ctx1', 'New');
      const model = createModel(newCtx, [translation('ToDelete', 'Value', 'en', oldCtx)]);

      model.applyChanges({}, {}, ['ToDelete']);

      const diff = model.getDiff();
      expect(diff.deletedKeys).toContain('ToDelete');
      expect(diff.contextLabelChanged).toBe(true);
    });

    it('should return correct hasChanges state', () => {
      const context = createContext('ctx1', 'Test');
      const modelNoChanges = createModel(context, [translation('Key', 'Key', 'en', context)]);
      const modelWithChanges = createModel(context);
      modelWithChanges.applyChanges({}, { New: 'New' }, []);

      expect(modelNoChanges.hasChanges()).toBe(false);
      expect(modelWithChanges.hasChanges()).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle simultaneous rename, delete, and create', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('Old', 'Old', 'en', context),
        translation('Old', 'Viejo', 'es', context),
        translation('ToDelete', 'ToDelete', 'en', context),
        translation('Keep', 'Keep', 'en', context),
      ]);

      model.applyChanges({ Old: 'New' }, { New: 'New', Keep: 'Keep', BrandNew: 'BrandNew' }, [
        'ToDelete',
      ]);

      expectKey(model, 'New', 'es', 'Viejo');
      expectKey(model, 'Old', 'en');
      expectKey(model, 'ToDelete', 'en');
      expectKey(model, 'Keep', 'en', 'Keep');
      expectKey(model, 'BrandNew', 'en', 'BrandNew');
    });

    it('should handle multiple renames to same target', () => {
      const context = createContext('ctx1', 'Test');
      const model = createModel(context, [
        translation('Key1', 'V1', 'en', context),
        translation('Key2', 'V2', 'en', context),
      ]);

      model.applyChanges({ Key1: 'Target', Key2: 'Target' }, { Target: 'Target' }, []);

      expectKey(model, 'Target', 'en', 'Target');
      expectKey(model, 'Target', 'es', 'Target');
    });

    it('should update context label and rename keys together', () => {
      const oldCtx = createContext('ctx1', 'Old');
      const newCtx = createContext('ctx1', 'New');
      const model = createModel(newCtx, [
        translation('OldKey', 'OldKey', 'en', oldCtx),
        translation('OldKey', 'Vieja', 'es', oldCtx),
      ]);

      model.applyChanges({ OldKey: 'NewKey' }, { NewKey: 'NewKey' }, []);

      expect(model.getDiff().contextLabelChanged).toBe(true);
      expect(model.getContextInfo().label).toBe('New');
      expectKey(model, 'NewKey', 'es', 'Vieja');
    });
  });

  describe('Getters', () => {
    it('should return all translations and context info', () => {
      const context = createContext('ctx1', 'TestLabel');
      const model = createModel(context, [
        translation('Key1', 'V1', 'en', context),
        translation('Key1', 'V1es', 'es', context),
      ]);

      expect(model.getAllTranslations()).toHaveLength(2);
      expect(model.getContextInfo()).toEqual(context);
    });

    it('should reflect updated context label', () => {
      const model = createModel(createContext('ctx1', 'New'), [
        translation('Key', 'Val', 'en', createContext('ctx1', 'Old')),
      ]);

      expect(model.getContextInfo().label).toBe('New');
    });
  });
});
