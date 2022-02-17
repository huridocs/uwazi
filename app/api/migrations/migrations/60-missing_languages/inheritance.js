import { translator } from './translator.js';

class Inheritance {
  constructor() {
    this.propertyIdToName = {};
    this.templateInfo = {};
    this.cleanup();
  }

  cleanup() {
    this.sourceLanguageInfo = {};
    this.sourceEntityInfo = {};
  }

  async build(db) {
    const templates = await db.collection('templates').find({}).toArray();
    this.propertyIdToName = Object.fromEntries(
      templates
        .map(t => t.properties)
        .flat()
        .filter(p => p._id)
        .map(p => [p._id, p.name])
    );
    this.templateInfo = templates
      .map(template => [
        template._id,
        template.properties
          ?.filter(p => p.type === 'relationship')
          .map(p => [
            p.name,
            {
              ...p.inherit,
              sourcePropertyName: this.propertyIdToName[p.inherit?.property],
              template: p.content,
            },
          ]),
      ])
      .filter(info => info[1].length !== 0)
      .map(([key, value]) => [key, Object.fromEntries(value)]);
    this.templateInfo = Object.fromEntries(this.templateInfo);
  }

  isPropertyInherited(templateId, propertyName) {
    return templateId in this.templateInfo && propertyName in this.templateInfo[templateId];
  }

  async loadSources(db, languageToSourceSharedId) {
    const sources = (
      await Promise.all(
        Object.entries(languageToSourceSharedId).map(async ([lang, idSet]) =>
          db
            .collection('entities')
            .find(
              { language: lang, sharedId: { $in: Array.from(idSet) } },
              { projection: { sharedId: 1, language: 1, metadata: 1, title: 1 } }
            )
            .toArray()
        )
      )
    ).flat();
    sources.forEach(source => {
      if (!(source.sharedId in this.sourceEntityInfo)) {
        this.sourceEntityInfo[source.sharedId] = {};
      }
      this.sourceEntityInfo[source.sharedId][source.language] = {
        metadata: source.metadata,
        title: source.title,
      };
    });
  }

  async prepareForBatch(db, assignedEntities, sharedIdToMissing, sharedIdToAssigned) {
    this.cleanup();
    const languageToSourceSharedId = {};
    assignedEntities.forEach(entity => {
      this.sourceLanguageInfo[entity.sharedId] = {};
      Object.entries(entity.metadata || {}).forEach(([name, data]) => {
        if (this.isPropertyInherited(entity.template, name) && data.length !== 0) {
          const requestedLanguages = sharedIdToMissing[entity.sharedId];
          data.forEach(item => {
            const requestedToSource = {};
            const sourceSharedId = item.value;
            requestedLanguages.forEach(lang => {
              const sourceLanguage = sharedIdToMissing[sourceSharedId]?.has(lang)
                ? sharedIdToAssigned[sourceSharedId]
                : lang;
              if (!(sourceLanguage in languageToSourceSharedId)) {
                languageToSourceSharedId[sourceLanguage] = new Set();
              }
              requestedToSource[lang] = sourceLanguage;
              languageToSourceSharedId[sourceLanguage].add(sourceSharedId);
            });
            this.sourceLanguageInfo[entity.sharedId][sourceSharedId] = requestedToSource;
          });
        }
      });
    });
    await this.loadSources(db, languageToSourceSharedId);
  }

  getSource(targetSharedId, sourceSharedId, language) {
    const sourceLanguage = this.sourceLanguageInfo[targetSharedId][sourceSharedId][language];
    return this.sourceEntityInfo[sourceSharedId][sourceLanguage];
  }

  getInheritedValue(name, targetTemplateId, source, language) {
    const sourcePropertyId = this.templateInfo[targetTemplateId][name].property;
    const sourcePropertyName = this.propertyIdToName[sourcePropertyId];
    return translator.translateProperty(
      sourcePropertyName,
      source.metadata[sourcePropertyName],
      language
    );
  }

  inheritProperty(property, targetTemplateId, targetSharedId, language) {
    const [name, values] = property;
    if (this.isPropertyInherited(targetTemplateId, name)) {
      const newValues = values.map(value => {
        const source = this.getSource(targetSharedId, value.value, language);
        const newValue = { ...value, label: source.title };
        if ('inheritedValue' in newValue) {
          newValue.inheritedValue = this.getInheritedValue(
            name,
            targetTemplateId,
            source,
            language
          );
        }
        return newValue;
      });
      return [name, newValues];
    }
    return property;
  }

  inheritMetadata(metadata, targetTemplateId, targetSharedId, language) {
    const returned = Object.entries(metadata || {}).map(p =>
      this.inheritProperty(p, targetTemplateId, targetSharedId, language)
    );
    return Object.fromEntries(returned);
  }
}

const inheritance = new Inheritance();

export { inheritance };
