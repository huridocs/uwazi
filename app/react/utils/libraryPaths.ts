const LIBRARY_PATH = '/library';
const LIBRARY_V2_PATH = '/libraryv2';
const LEGACY_LIBRARY_PATH = '/legacy-library';

const isLibraryV2Enabled = (features?: { [key: string]: unknown } | null): boolean =>
  Boolean(features?.featureFlagLibraryV2);

/** Default public path for the V2 library (depends on soft-deploy flag). */
const getLibraryV2BasePath = (libraryV2: boolean): string =>
  libraryV2 ? LIBRARY_PATH : LIBRARY_V2_PATH;

/** V1 library base path (legacy mount when V2 owns /library). */
const getLibraryV1BasePath = (libraryV2: boolean): string =>
  libraryV2 ? LEGACY_LIBRARY_PATH : LIBRARY_PATH;

const isLegacyLibraryPath = (pathname: string): boolean =>
  /(?:^|\/)legacy-library(?:\/|$)/.test(pathname);

const isLibraryV2MountPath = (pathname: string): boolean =>
  /(?:^|\/)libraryv2(?:\/|$)/.test(pathname);

/** True when pathname is the /library tree (not libraryv2 / legacy-library). */
const isLibraryPath = (pathname: string): boolean =>
  /(?:^|\/)library(?:\/|$)/.test(pathname) &&
  !isLibraryV2MountPath(pathname) &&
  !isLegacyLibraryPath(pathname);

const isLibraryV2Route = (pathname: string, libraryV2: boolean): boolean =>
  isLibraryV2MountPath(pathname) || (libraryV2 && isLibraryPath(pathname));

export {
  LIBRARY_PATH,
  LIBRARY_V2_PATH,
  LEGACY_LIBRARY_PATH,
  isLibraryV2Enabled,
  getLibraryV2BasePath,
  getLibraryV1BasePath,
  isLegacyLibraryPath,
  isLibraryV2MountPath,
  isLibraryPath,
  isLibraryV2Route,
};
