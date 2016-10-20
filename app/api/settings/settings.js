import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import translations from 'api/i18n/translations';

function saveLinksTranslations(newLinks = [], currentLinks = []) {
  let updatedTitles = {};
  let deletedLinks = [];

  currentLinks.forEach((link) => {
    let matchLink = newLinks.find((l) => l.localID === link.localID);
    if (matchLink && matchLink.title !== link.title) {
      updatedTitles[link.title] = matchLink.title;
    }
    if (!matchLink) {
      deletedLinks.push(link.title);
    }
  });

  let values = newLinks.reduce((result, link) => {
    result[link.title] = link.title;
    return result;
  }, {});

  translations.updateContext('Menu', 'Menu', updatedTitles, deletedLinks, values);
}

export default {
  get() {
    return request.get(`${dbURL}/_design/settings/_view/all`)
    .then((result) => {
      if (result.json.rows.length) {
        return result.json.rows[0].value;
      }

      return {};
    });
  },

  save(settings) {
    settings.type = 'settings';

    let url = dbURL;
    if (settings._id) {
      url = `${dbURL}/_design/settings/_update/partialUpdate/${settings._id}`;
    }

    return this.get()
    .then((currentSettings) => {
      saveLinksTranslations(settings.links, currentSettings.links);
      return request.post(url, settings);
    })
    .then(response => this.get(`${dbURL}/${response.json.id}`));
  }
};
