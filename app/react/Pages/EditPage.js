import React from 'react';
import { actions as formActions } from 'react-redux-form';

import RouteHandler from 'app/App/RouteHandler';

import { PageCreator } from 'app/Pages/components/PageCreator';
import { withRouter } from 'app/componentWrappers';
import pagesAPI from './PagesAPI';

class EditPageComponent extends RouteHandler {
  static async requestState(requestParams) {
    const page = await pagesAPI.getById(requestParams);

    return [formActions.load('page.data', page)];
  }

  componentDidMount() {
    this.context.store.dispatch(formActions.reset('page.data'));
  }

  render() {
    return (
      <div className="settings-content">
        <PageCreator />
      </div>
    );
  }
}

const EditPage = withRouter(EditPageComponent);

export { EditPage, EditPageComponent };
