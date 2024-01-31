import React, { useEffect, useRef, useState } from 'react';

/* eslint-disable comma-spacing */
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

/* eslint-disable comma-spacing */
const withDnD = <T,>(Component: React.FC<T>) =>
  withLazy<T>(
    Component,
    async () => import('react-dnd'),
    (module: any) => ({
      useDrag: module.useDrag,
      useDrop: module.useDrop,
      useDragDropManager: module.useDragDropManager,
      DndProvider: module.DndProvider,
    })
  );

/* eslint-disable comma-spacing */
const withDnDBackend = <T,>(Component: React.FC<T>) =>
  withLazy<T>(
    Component,
    async () => import('react-dnd-html5-backend'),
    (module: any) => ({
      HTML5Backend: module.HTML5Backend,
    })
  );
export { withDnD, withDnDBackend, withLazy };
