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

  // Skip loader revalidation when only Entity UI params change (main tab ?m=, side tab / hash).
  // Same sharedId + pathname: tab switching must not refetch summary/anchors/resolved.
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
