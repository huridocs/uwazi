import Immutable from 'immutable';
import settings from 'api/settings';

const defaultSettings = new Map([[/{{MAP_TILER_KEY}}/g, 'abdc']]);
const prepareMapStyleJson = async style => {
  const key = (await settings.get()).mapTilesKey;
  let stringifyStyle = JSON.stringify(style);
  defaultSettings.forEach((v, k) => {
    stringifyStyle = stringifyStyle.replace(k, key);
  });
  return Immutable.fromJS(JSON.parse(stringifyStyle));
};
export { prepareMapStyleJson };
