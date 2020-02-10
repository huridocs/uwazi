import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import { enterLibrary, zoomIn, zoomOut } from 'app/Library/actions/libraryActions';
import requestState from 'app/Library/helpers/requestState';
import SearchButton from 'app/Library/components/SearchButton';
import LibraryLayout from 'app/Library/LibraryLayout';
import { wrapDispatch } from 'app/Multireducer';
import ImportProgress from 'app/Uploads/components/ImportProgress';

export default class Library extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
  }

  static renderTools() {
    return (
      <React.Fragment>
        <div className="searchBox">
          <SearchButton storeKey="library" />
        </div>
        <ImportProgress />
      </React.Fragment>
    );
  }

  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources);
  }

  // setReduxState(state) {
  //   setReduxState(state, this.context);
  // }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  componentWillMount() {
    const { dispatch } = this.context.store;
    wrapDispatch(dispatch, 'library')(enterLibrary());
    this.zoomIn = () => wrapDispatch(dispatch, 'library')(zoomIn());
    this.zoomOut = () => wrapDispatch(dispatch, 'library')(zoomOut());
  }

  render() {
    return (
      <LibraryLayout>
        <LibraryModeToggleButtons storeKey="library" zoomIn={this.zoomIn} zoomOut={this.zoomOut} />
        <DocumentsList storeKey="library" />
      </LibraryLayout>
    );
  }
}
