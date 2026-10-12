const V2_PREVIEW_COOKIE = 'uwazi_v2_preview';
const PREVIEW_COOKIE_ON = `${V2_PREVIEW_COOKIE}=1; Path=/; SameSite=Lax; HttpOnly`;
const PREVIEW_COOKIE_OFF = `${V2_PREVIEW_COOKIE}=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0`;

type PreviewDecision = 'on' | 'off' | 'absent';

type PreviewableSettings = {
  themeCustomization?: boolean;
  features?: { [key: string]: unknown };
};

type V2PreviewRequest = {
  search: string;
  cookieHeader?: string;
};

type V2PreviewResult<T extends PreviewableSettings> = {
  settings: T;
  setCookie?: string;
};

const readCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
};

const queryDecision = (search: string): PreviewDecision => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (!params.has('v2')) return 'absent';
  const value = (params.get('v2') ?? '').toLowerCase();
  if (value === '' || value === '1' || value === 'true') return 'on';
  if (value === '0' || value === 'false') return 'off';
  return 'absent';
};

const overlayUiV2 = <T extends PreviewableSettings>(settings: T): T => {
  const next: T = { ...settings, themeCustomization: true };
  next.features = {
    ...settings.features,
    newHeader: true,
    featureFlagLibraryV2: true,
    featureFlagEntityViewerv2: true,
    themeCustomization: true,
  };
  return next;
};

const resolvePreview = (request: V2PreviewRequest): { on: boolean; setCookie?: string } => {
  const decision = queryDecision(request.search);
  if (decision === 'on') return { on: true, setCookie: PREVIEW_COOKIE_ON };
  if (decision === 'off') return { on: false, setCookie: PREVIEW_COOKIE_OFF };
  return { on: readCookie(request.cookieHeader, V2_PREVIEW_COOKIE) === '1' };
};

const previewThemeCustomization = (
  tenantFlag: boolean | undefined,
  request: V2PreviewRequest
): boolean => Boolean(tenantFlag) || resolvePreview(request).on;

const applyV2Preview = <T extends PreviewableSettings>(
  settings: T,
  request: V2PreviewRequest
): V2PreviewResult<T> => {
  const { on, setCookie } = resolvePreview(request);
  return { settings: on ? overlayUiV2(settings) : settings, setCookie };
};

export { applyV2Preview, previewThemeCustomization };
