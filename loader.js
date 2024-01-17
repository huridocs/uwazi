import { pathToFileURL } from 'url';
import { resolve as resolveTs, getFormat, transformSource, load } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';

export { getFormat, transformSource, load };

const { absoluteBaseUrl } = tsConfigPaths.loadConfig();
const paths = {
  // must match babel.config.json
  'api/*': ['./app/api/*'],
  'app/*': ['./app/react/*'],
  'shared/*': ['./app/shared/*'],
  UI: ['./app/react/UI'],
  'UI/*': ['./app/react/UI/*'],
  'V2/*': ['./app/react/V2/*'],
  '#app/*': ['app/*'],
  'database/*': ['database'],
};

const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);

export function resolve(specifier, context, defaultResolver) {
  const mappedSpecifier = matchPath(specifier);
  console.log(mappedSpecifier);
  if (mappedSpecifier) {
    specifier = `${pathToFileURL(mappedSpecifier)}.ts`;
  }
  return resolveTs(specifier, context, defaultResolver);
}
