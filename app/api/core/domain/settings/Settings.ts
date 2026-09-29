import { LanguageISO6391, LanguageSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import {
  CannotDeleteDefaultLanguageError,
  DefaultLanguageMissingError,
  LanguageNotFoundError,
} from './errors.js';
import { assignMenuIds, removeTemplateFromFilterTree, renameFilterTree } from './settingsTree.js';

class Settings {
  private state: SettingsType;

  constructor(props: SettingsType = {}) {
    this.state = { ...props };
  }

  get languages() {
    return this.state.languages;
  }

  get filters() {
    return this.state.filters;
  }

  get links() {
    return this.state.links;
  }

  get site_name() {
    return this.state.site_name;
  }

  get customCSS() {
    return this.state.customCSS;
  }

  get dateFormat() {
    return this.state.dateFormat;
  }

  get newNameGeneration() {
    return this.state.newNameGeneration;
  }

  get sync() {
    return this.state.sync;
  }

  get _id() {
    return this.state._id;
  }

  get mailerConfig() {
    return this.state.mailerConfig;
  }

  get senderEmail() {
    return this.state.senderEmail;
  }

  get project() {
    return this.state.project;
  }

  get features() {
    return this.state.features;
  }

  get publicFormDestination() {
    return this.state.publicFormDestination;
  }

  get isPrivate() {
    return this.state.private;
  }

  toState(): SettingsType {
    return { ...this.state };
  }

  setDefaultLanguage(key: LanguageISO6391 | string): void {
    this.requireLanguage(key);
    this.state.languages = (this.state.languages ?? []).map(language => ({
      ...language,
      default: language.key === key,
    }));
  }

  addLanguage(language: LanguageSchema): boolean {
    if (this.state.languages?.some(item => item.key === language.key)) {
      return false;
    }
    this.state.languages = [...(this.state.languages ?? []), language];
    return true;
  }

  setLanguageInstalling(key: LanguageISO6391 | string, installing: boolean): void {
    this.requireLanguage(key);
    this.state.languages = (this.state.languages ?? []).map(language =>
      language.key === key ? { ...language, installing } : language
    );
  }

  deleteLanguage(key: LanguageISO6391 | string): void {
    const language = this.requireLanguage(key);
    if (language.default) {
      throw new CannotDeleteDefaultLanguageError();
    }
    this.state.languages = (this.state.languages ?? []).filter(item => item.key !== key);
  }

  defaultLanguageKey(): LanguageISO6391 {
    const defaultLanguage = this.state.languages?.find(language => language.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError();
    }
    return defaultLanguage.key;
  }

  renameFilter(filterId: ObjectIdSchema, name: string): boolean {
    const renamed = renameFilterTree(this.state.filters ?? [], filterId, name);
    if (!renamed) {
      return false;
    }
    this.state.filters = renamed;
    return true;
  }

  removeTemplateFromFilters(templateId: ObjectIdSchema): boolean {
    if (!this.state.filters) {
      return false;
    }
    this.state.filters = removeTemplateFromFilterTree(this.state.filters, templateId);
    return true;
  }

  apply(incoming: SettingsType, generateId: () => string): void {
    const { _id: _incomingId, __v: _version, ...fields } = incoming;
    Object.assign(this.state, fields);
    if (fields.links) {
      this.state.links = assignMenuIds(fields.links, generateId);
    }
  }

  didEnableNewNameGeneration(previous: Settings): boolean {
    return !previous.newNameGeneration && Boolean(this.state.newNameGeneration);
  }

  deactivateSyncConfig(name: string): number {
    const sync = this.state.sync ?? [];
    let modified = 0;
    this.state.sync = sync.map(config => {
      if (config.name === name && config.active) {
        modified += 1;
        return { ...config, active: false };
      }
      return config;
    });
    return modified;
  }

  private requireLanguage(key: LanguageISO6391 | string): LanguageSchema {
    const language = this.state.languages?.find(item => item.key === key);
    if (!language) {
      throw new LanguageNotFoundError(String(key));
    }
    return language;
  }
}

export { Settings };
