import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Settings, SettingsLinkSchema } from 'shared/types/settingsType';

interface ClientSettingsLinkSchema extends SettingsLinkSchema {
  localID?: string;
}

interface ClientSettingsSchema extends Omit<Settings, 'links'> {
  links?: ClientSettingsLinkSchema[];
}

export default {
  async save(settings: RequestParams<ClientSettingsSchema>): Promise<Settings> {
    const processedSettings = settings.set({
      ...settings.data,
      links: settings.data?.links?.map(link => {
        const { localID, ...linkWithoutLocalID } = link;
        return linkWithoutLocalID;
      }),
    });
    return api.post('settings', processedSettings).then((response: any) => response.json);
  },

  async get(query: RequestParams = new RequestParams()): Promise<Settings> {
    return api.get('settings', query).then((response: any) => response.json);
  },
};
