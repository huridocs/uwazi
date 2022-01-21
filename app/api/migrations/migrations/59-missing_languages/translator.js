import { ObjectId } from 'mongodb';

const translatedPropertyTypes = new Set(['select', 'multiselect']);

class Translator {
  constructor() {
    this.propertyNameToContent = {};
    this.dictionaryInfo = {};
    this.translationInfo = {};
  }

  async buildPropertyInfo(db) {
    const templates = await db.collection('templates').find().toArray();
    templates.forEach(t => {
      t.properties.forEach(p => {
        if (translatedPropertyTypes.has(p.type)) {
          this.propertyNameToContent[p.name] = p.content;
        }
      });
    });
  }

  async buildDictionaryInfo(db) {
    const dictionaries = await db
      .collection('dictionaries')
      .find({
        _id: {
          $in: Array.from(new Set(Object.values(this.propertyNameToContent))).map(id =>
            ObjectId(id)
          ),
        },
      })
      .toArray();
    dictionaries.forEach(d => {
      const idToLabel = {};
      d.values.forEach(element => {
        idToLabel[element.id] = element.label;
      });
      this.dictionaryInfo[d._id] = idToLabel;
    });
  }

  async buildTranslationInfo(db) {
    const translations = await db.collection('translations').find().toArray();
    translations.forEach(tr => {
      const dictIdToContext = {};
      tr.contexts.forEach(c => {
        const labelToValue = {};
        c.values.forEach(element => {
          labelToValue[element.key] = element.value;
        });
        dictIdToContext[c.id] = labelToValue;
      });
      this.translationInfo[tr.locale] = dictIdToContext;
    });
  }

  async build(db) {
    await this.buildPropertyInfo(db);
    await this.buildDictionaryInfo(db);
    await this.buildTranslationInfo(db);
  }

  valueToNewLabel(propertyName, label, language) {
    const thesaurusId = this.propertyNameToContent[propertyName];
    const thesaurusEntryLabel = this.dictionaryInfo[thesaurusId][label];
    return this.translationInfo[language][thesaurusId][thesaurusEntryLabel];
  }

  translateProperty(propertyName, propertyObjects, language) {
    if (propertyName in this.propertyNameToContent) {
      return propertyObjects.map(o => ({
        ...o,
        label: this.valueToNewLabel(propertyName, o.value, language),
      }));
    }
    return propertyObjects.map(o => ({ ...o }));
  }

  translateMetadata(metadata, language) {
    const translatedMetadata = {};
    Object.entries(metadata).forEach(([key, value]) => {
      translatedMetadata[key] = this.translateProperty(key, value, language);
    });
    return translatedMetadata;
  }
}

const translator = new Translator();

export { translator };
