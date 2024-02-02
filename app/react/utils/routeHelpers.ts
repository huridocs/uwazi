import { Location } from 'react-router-dom';
import rison from 'rison-node';
import { risonDecodeOrIgnore } from 'app/utils';

const validateHomePageRoute = (route: string) => {
  const queryParams = '(\\?.*)?)';
  const languageMatch = '(/[a-zA-Z]{2,3})?';
  const library = `(library(/map)?(/table)?/?${queryParams}`;
  const entity = '(entity/.+)';
  const page = '(page/.+)';
  const matcher = new RegExp(`${languageMatch}/(${library}|${page}|${entity})$`);
  return route.match(matcher) !== null;
};

const searchParamsFromLocationSearch = (location: Location, param: string = 'q') => {
  const urlSearchParams = new URLSearchParams(location.search);
  const paramJSON = risonDecodeOrIgnore(decodeURIComponent(urlSearchParams.get(param) || '()'));
  return paramJSON;
};

const searchParamsFromSearchParams = (searchParams: URLSearchParams) => {
  let params: any = {};
  searchParams.forEach((value, key) => {
    params = { ...params, [key]: value };
  });
  return params;
};

export { validateHomePageRoute, searchParamsFromLocationSearch, searchParamsFromSearchParams };
