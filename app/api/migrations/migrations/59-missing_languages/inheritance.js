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
    console.log(this.templateInfo);
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
    // console.log(sources);
    sources.forEach(source => {
      if (!(source.sharedId in this.sourceEntityInfo)) {
        this.sourceEntityInfo[source.sharedId] = {};
      }
      this.sourceEntityInfo[source.sharedId][source.language] = {
        metadata: source.metadata,
        title: source.title,
      };
    });
    // console.log(this.sourceEntityInfo);
  }

  async prepareForBatch(db, assignedEntities, sharedIdToMissing, sharedIdToAssigned) {
    this.cleanup();
    const languageToSourceSharedId = {};
    // console.log(assignedEntities);
    assignedEntities.forEach(entity => {
      this.sourceLanguageInfo[entity.sharedId] = {};
      Object.entries(entity.metadata).forEach(([name, data]) => {
        if (this.isPropertyInherited(entity.template, name)) {
          const sourceSharedId = data[0].value;
          const requestedLanguages = sharedIdToMissing.get(entity.sharedId);
          const requestedToSource = {};
          requestedLanguages.forEach(lang => {
            const sourceLanguage = sharedIdToMissing.get(sourceSharedId)?.has(lang)
              ? sharedIdToAssigned.get(sourceSharedId)
              : lang;
            if (!(sourceLanguage in languageToSourceSharedId)) {
              languageToSourceSharedId[sourceLanguage] = new Set();
            }
            requestedToSource[lang] = sourceLanguage;
            languageToSourceSharedId[sourceLanguage].add(sourceSharedId);
          });
          this.sourceLanguageInfo[entity.sharedId][sourceSharedId] = requestedToSource;
        }
      });
    });
    // console.log(this.sourceLanguageInfo);
    // console.log(languageToSourceSharedId);
    await this.loadSources(db, languageToSourceSharedId);
  }

  getSource(targetSharedId, sourceSharedId, language) {
    const sourceLanguage = this.sourceLanguageInfo[targetSharedId][sourceSharedId][language];
    // console.log(`${sourceSharedId} ---> ${sourceLanguage}`);
    return this.sourceEntityInfo[sourceSharedId][sourceLanguage];
  }

  // eslint-disable-next-line max-statements
  inheritProperty(property, targetTemplateId, targetSharedId, language) {
    // console.log(this.sourceEntityInfo);
    const [name, values] = property;
    if (this.isPropertyInherited(targetTemplateId, name)) {
      const [value] = values;
      const sourceSharedId = value.value;
      const source = this.getSource(targetSharedId, sourceSharedId, language);
      // console.log(source);
      const returned = { ...value, label: source.title };
      if ('inheritedValue' in returned) {
        const sourcePropertyId = this.templateInfo[targetTemplateId][name].property;
        const sourcePropertyName = this.propertyIdToName[sourcePropertyId];
        returned.inheritedValue = translator.translateProperty(
          sourcePropertyName,
          source.metadata[sourcePropertyName],
          language
        );
      }
      return [name, [returned]];
    }
    return property;
  }

  inheritMetadata(metadata, targetTemplateId, targetSharedId, language) {
    // console.log(targetTemplateId);
    // console.log(metadata);
    const returned = Object.entries(metadata).map(p =>
      this.inheritProperty(p, targetTemplateId, targetSharedId, language)
    );
    // console.log(`-----returned\n${JSON.stringify(returned, null, 2)}\n-----done`);
    return Object.fromEntries(returned);
  }
}

const inheritance = new Inheritance();

export { inheritance };
