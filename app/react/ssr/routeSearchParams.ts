import React from 'react';

type RouteParams = Record<string, string | undefined>;

type ElementProps = {
  params?: { q?: string };
  children?: React.ReactNode;
};

const isElement = (element: React.ReactNode): element is React.ReactElement<ElementProps> =>
  React.isValidElement<ElementProps>(element);

const searchParamsWithChildQuery = (
  routeParams: RouteParams,
  element: React.ReactNode,
  urlQuery: string | undefined
): RouteParams => {
  if (routeParams.q || urlQuery || !isElement(element)) {
    return routeParams;
  }
  const child = element.props.children;
  const q = isElement(child) ? child.props.params?.q : undefined;
  return q ? { ...routeParams, q } : routeParams;
};

export { searchParamsWithChildQuery };
