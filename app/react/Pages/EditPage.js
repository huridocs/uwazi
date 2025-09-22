import React from 'react';
import { actions as formActions } from 'react-redux-form';

import RouteHandler from '../../App/RouteHandler.js';

import { PageCreator } from '../../Pages/components/PageCreator.js';
import { withRouter } from '../../componentWrappers.js';
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
