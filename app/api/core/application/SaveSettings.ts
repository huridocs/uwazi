import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { validateSettings } from '#shared/types/settingsSchema.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { persistMenuAndFilterTranslations } from './settings/menuAndFilterTranslations.js';
import { applySettingsDefaults, omitHiddenSettingsFields } from './settings/settingsDefaults.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';

type Input = Settings;

type Output = Settings;

type Deps = {
  settingsDS: SettingsDataSource;
  translationsService: TranslationsService;
};

const updateTemplatesForNewNameGeneration = async (currentSettings: Settings) => {
  const dao = TemplatesDAOFactory.default();
  const templates = (await dao.get()) as TemplateDBO[];
  const defaultLanguage = currentSettings.languages?.find(language => language.default)?.key;

  if (!defaultLanguage) {
    return;
  }

  await ArrayUtils.sequentialFor(templates, async (template: TemplateDBO) => {
    await TemplateFacade.update({ ...template, reindex: false }, defaultLanguage);
  });
};

class SaveSettingsUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(incoming: Input): Promise<Output> {
    await validateSettings(incoming);
    const current = (await this.deps.settingsDS.find()) ?? {};
    const id = current._id ?? this.idGenerator.generate();
    const toPersist = this.ensureLinkIds(incoming);

    const saved = await this.transactionManager.run(async () => {
      await persistMenuAndFilterTranslations(this.deps.translationsService, toPersist, current);
      return this.deps.settingsDS.patch({ ...toPersist, _id: id });
    });

    if (!current.newNameGeneration && incoming.newNameGeneration) {
      await updateTemplatesForNewNameGeneration(current);
    }

    return omitHiddenSettingsFields(applySettingsDefaults(saved));
  }

  private ensureLinkIds(incoming: Input): Input {
    if (!incoming.links) {
      return incoming;
    }

    const withId = <T extends { _id?: unknown }>(item: T): T =>
      item._id ? item : { ...item, _id: this.idGenerator.generate() };

    return {
      ...incoming,
      links: incoming.links.map(link => {
        const withLinkId = withId(link);
        if (!link.sublinks) {
          return withLinkId;
        }
        return {
          ...withLinkId,
          sublinks: link.sublinks.map(sublink => withId(sublink)),
        };
      }),
    };
  }
}

export { SaveSettingsUseCase };
export type { Input as SaveSettingsInput };
