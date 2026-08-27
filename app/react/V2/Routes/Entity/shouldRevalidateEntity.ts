import type { ShouldRevalidateFunction } from 'react-router';

const shouldRevalidateEntity: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (formMethod && formMethod.toUpperCase() !== 'GET') {
    return true;
  }

  if (
    currentParams.sharedId === nextParams.sharedId &&
    currentUrl.pathname === nextUrl.pathname &&
    (currentUrl.search !== nextUrl.search || currentUrl.hash !== nextUrl.hash)
  ) {
    return false;
  }

  return defaultShouldRevalidate;
};

export { shouldRevalidateEntity };
