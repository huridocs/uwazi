import ID from 'shared/uniqueID';
import { PageType } from 'shared/types/pageType';
import { validatePage } from 'shared/types/pageSchema';
import date from 'api/utils/date.js';
import templates from 'api/templates';
import { createError } from 'api/utils';
import { UwaziFilterQuery } from 'api/odm';
import { User } from 'api/users/usersModel';

import model from './pagesModel';
import settings from '../settings';

const assignUserAndDate = (page: PageType, user?: User) => {
  if (!user) {
    throw new Error('missing user');
  }
  return {
    ...page,
    user: user._id,
    creationDate: date.currentUTC(),
  };
};

const entityViewSyncing = async (page: PageType) => {
  const pageInAllLaguangues = await model.get({ sharedId: page.sharedId }, '_id entityView');
  const updatedPages = pageInAllLaguangues.map(_id => ({
    ..._id,
    entityView: page.entityView || false,
  }));
  await model.saveMultiple(updatedPages);
};

export default {
  // eslint-disable-next-line max-statements
  async save(_page: PageType, user?: User, language?: string) {
    await validatePage(_page);
    let page = { ..._page };

    if (!page.sharedId) {
      page = assignUserAndDate(page, user);
    }

    if (page.sharedId) {
      await entityViewSyncing(page);
      return model.save(page);
    }

    const { languages = [] } = await settings.get();
    const sharedId = ID();
    const pages = languages.map(lang => ({
      ...page,
      language: lang.key,
      sharedId,
    }));
    await model.saveMultiple(pages);
    return this.getById(sharedId, language);
  },

  async get(query: UwaziFilterQuery<PageType>, select?: string) {
    return model.get(query, select);
  },

  async getById(sharedId: string, language?: string, select?: string) {
    const results = await this.get({ sharedId, language }, select);
    return results[0] ? results[0] : Promise.reject(createError('Page not found', 404));
  },

  async delete(sharedId: string) {
    const templatesUsingPage = await templates.get({
      entityViewPage: sharedId,
    });
    if (templatesUsingPage.length > 0) {
      const templatesTitles = templatesUsingPage.map(template => template.name);
      return Promise.reject(
        createError(
          `This page is in use by the following templates: ${templatesTitles.join(
            ', '
          )}. Remove the page from the templates before trying again.`,
          409
        )
      );
    }
    return model.delete({ sharedId });
  },

  async addLanguage(language: string) {
    const [lanuageTranslationAlreadyExists] = await this.get({ language });
    if (lanuageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await settings.get();

    const defaultLanguage = languages?.find(l => l.default)?.key;

    const duplicate = async () => {
      const pages = await this.get({ language: defaultLanguage });
      const savePages = pages.map(async _page => {
        const page: PageType = { ..._page, language };
        delete page._id;
        delete page.__v;
        return this.save(page);
      });

      return Promise.all(savePages);
    };

    return duplicate();
  },

  // TEST!!!
  async removeLanguage(language: string) {
    return model.delete({ language });
  },

  count: model.count.bind(model),
};
