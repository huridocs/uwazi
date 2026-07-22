import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

type UpdateEntityUrlOptions = {
  replace?: boolean;
  search?: (params: URLSearchParams) => void;
  hash?: (params: URLSearchParams) => void;
};

const parseEntityHash = (hash: string = ''): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const serializeEntityHash = (params: URLSearchParams): string => {
  const str = params.toString();
  return str ? `#${str}` : '';
};

const useEntityHashParams = () => {
  const { hash } = useLocation();
  return useMemo(() => parseEntityHash(hash), [hash]);
};

const useUpdateEntityUrl = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(
    (options: UpdateEntityUrlOptions) => {
      const nextSearch = new URLSearchParams(
        location.search.startsWith('?') ? location.search.slice(1) : location.search
      );
      const nextHash = parseEntityHash(location.hash);
      options.search?.(nextSearch);
      options.hash?.(nextHash);
      const search = nextSearch.toString();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget URL sync
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: serializeEntityHash(nextHash),
        },
        { replace: options.replace ?? true, preventScrollReset: true }
      );
    },
    [location.hash, location.pathname, location.search, navigate]
  );
};

export { parseEntityHash, serializeEntityHash, useEntityHashParams, useUpdateEntityUrl };
export type { UpdateEntityUrlOptions };
