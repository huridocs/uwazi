import React from 'react';
import { Outlet, matchPath } from 'react-router';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { enterLibrary, unsetDocuments, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import { withRouter } from 'app/componentWrappers';
import { routes as appRoutes } from 'app/appRoutes';

class LibraryRootComponent extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;

    const { dispatch } = context.store;
    wrapDispatch(dispatch, 'library')(enterLibrary());
    this.zoomIn = () => wrapDispatch(dispatch, 'library')(zoomIn());
    this.zoomOut = () => wrapDispatch(dispatch, 'library')(zoomOut());
    this.scrollCallback = this.scrollCallback.bind(this);
    this.state = { scrollCount: 0 };
  }

  urlHasChanged(nextProps) {
    const nextSearchParams = new URLSearchParams(nextProps.location.search);
    const currentSearchParams = new URLSearchParams(this.props.location.search);
    return nextSearchParams.get('q') !== currentSearchParams.get('q');
  }

  componentDidUpdate(prevProps) {
    if (this.urlHasChanged(prevProps)) {
      this.getClientState(this.props);
    }
  }

  findMatchingRoute = (pathname, routes, parentPath = '') => {
    let result = null;

    routes.every(route => {
      if (result !== null) {
        return false;
      }

      const currentPath = `${parentPath}/${route.path || ''}`.replace('//', '/');
      const match = matchPath({ path: currentPath, end: false }, pathname);

      if (match) {
        if (currentPath === pathname && route.handle?.library) result = route;

        if (route.children) {
          const childMatch = this.findMatchingRoute(pathname, route.children, currentPath);
          if (childMatch) result = childMatch;
        }
      }
      return true;
    });

    return result;
  };

  componentWillUnmount() {
    const nextLocation = window?.location?.pathname;
    const matchedRoute = this.findMatchingRoute(nextLocation, appRoutes);
    if (!matchedRoute && !nextLocation.includes('library')) {
      this.emptyState();
    }
  }

  emptyState() {
    wrapDispatch(this.context.store.dispatch, 'library')(unsetDocuments());
    actions.set('library.sidepanel.quickLabelState', {});
  }

  scrollCallback(event) {
    if (event.target.className.includes('document-viewer')) {
      this.setState((prevState, _props) => ({
        scrollCount: prevState.scrollCount + 1,
      }));
    }
  }

  render() {
    if (this.props.children) {
      return this.props.children;
    }

    return <Outlet />;
  }
}

const SSRLibrary = withRouter(LibraryRootComponent);

export const LibraryRoot = Object.assign(SSRLibrary, {
  requestState: LibraryRootComponent.requestState,
});

export { LibraryRootComponent };
export default LibraryRoot;
