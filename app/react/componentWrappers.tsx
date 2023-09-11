/* eslint-disable comma-spacing */
/* eslint-disable react/no-multi-comp */
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  useLocation,
  useMatches,
  useNavigate,
  useOutlet,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { AppMainContext } from './App/AppMainContext';
import { searchParamsFromSearchParams } from './utils/routeHelpers';

const withRouter =
  <T,>(Component: React.ComponentClass<T & { params?: any }, any>) =>
  (props: T & { params?: any }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const matches = useMatches();
    const [searchParams, setSearchParams] = useSearchParams();
    const { q: searchString } = searchParamsFromSearchParams(searchParams);
    const paramsFromProps = { ...props.params, q: searchString || props.params?.q };

    return (
      <Component
        {...props}
        navigate={navigate}
        location={location}
        params={{ ...params, ...(paramsFromProps || {}) }}
        matches={matches}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
      />
    );
  };

const withContext =
  <T,>(Component: React.ComponentClass<T, any>) =>
  (props: T) => {
    const mainContext = useContext(AppMainContext);
    return <Component {...props} mainContext={mainContext} />;
  };

const withOutlet =
  <T,>(Component: React.ComponentClass<T, any>) =>
  (props: T) => {
    const outlet = useOutlet(AppMainContext);
    return <Component {...props} outlet={outlet} />;
  };

const withLazy =
  <T,>(Component: React.FC<T>, moduleImport: Function, extractor: (module: unknown) => {}) =>
  (props: T & { key?: string }) => {
    const lazyModuleRef = useRef({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      moduleImport().then((module: unknown) => {
        lazyModuleRef.current = extractor(module);
        setIsLoaded(true);
        return module;
      });
    }, []);

    const componentProps = { ...lazyModuleRef.current, ...props };

    return isLoaded ? <Component {...componentProps} /> : null;
  };

const withDnD = <T,>(Component: React.FC<T>) =>
  withLazy<T>(
    Component,
    async () => import('react-dnd'),
    (module: any) => ({
      useDrag: module.useDrag,
      useDrop: module.useDrop,
    })
  );

export { withRouter, withContext, withOutlet, withLazy, withDnD };
