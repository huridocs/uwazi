import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import { enterLibrary } from 'app/Library/actions/libraryActions';
import requestState from 'app/Library/helpers/requestState';
import setReduxState from 'app/Library/helpers/setReduxState';
import SearchButton from 'app/Library/components/SearchButton';
import LibraryLayout from 'app/Library/LibraryLayout';
import { wrapDispatch } from 'app/Multireducer';

export default class Library extends RouteHandler {
  constructor(props, context) {
    super(props, context);
    this.superComponentWillReceiveProps = super.componentWillReceiveProps;
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library"/>
      </div>
    );
  }

  static requestState(params, _query = {}, globalResources) {
    return requestState(params, _query, globalResources);
  }

  setReduxState(state) {
    setReduxState(state, this.context);
  }

  componentWillMount() {
    wrapDispatch(this.context.store.dispatch, 'library')(enterLibrary());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.query.q !== this.props.location.query.q) {
      this.superComponentWillReceiveProps(nextProps);
    }
  }

  render() {
    return (
      <LibraryLayout>
        <DocumentsList storeKey="library"/>
      </LibraryLayout>
    );
  }
}
