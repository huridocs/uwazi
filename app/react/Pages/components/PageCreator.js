import { Form, Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { MarkDown } from 'app/ReactReduxForms';
import {
  resetPage as resetPageAction,
  savePage as savePageAction,
} from 'app/Pages/actions/pageActions';
import ShowIf from 'app/App/ShowIf';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import validator from './ValidatePage';

export class PageCreator extends Component {
  componentWillUnmount() {
    const { resetPage } = this.props;
    resetPage();
  }

  render() {
    const { formState, page, savePage, savingPage } = this.props;
    const backUrl = '/settings/pages';
    const pageUrl = `/page/${page.data.sharedId}`;

    let nameGroupClass = 'template-name form-group';
    if (
      formState.title &&
      !formState.title.valid &&
      (formState.submitFailed || formState.title.touched)
    ) {
      nameGroupClass += ' has-error';
    }

    return (
      <div className="page-creator">
        <Form model="page.data" onSubmit={savePage} validators={validator()}>
          <div className="panel panel-default">
            <div className="metadataTemplate-heading panel-heading">
              <div className={nameGroupClass}>
                <Field model=".title">
                  <input placeholder="Page name" className="form-control" />
                </Field>
              </div>
            </div>
            <div className="panel-body page-viewer document-viewer">
              <ShowIf if={Boolean(page.data._id)}>
                <div className="alert alert-info">
                  <Icon icon="terminal" /> {pageUrl}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={pageUrl}
                    className="pull-right"
                  >
                    (view page)
                  </a>
                </div>
              </ShowIf>
              <MarkDown htmlOnViewer model=".metadata.content" rows={18} />
              <div className="alert alert-info">
                <Icon icon="info-circle" size="2x" />
                <div className="force-ltr">
                  Use{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://guides.github.com/features/mastering-markdown/"
                  >
                    Markdown
                  </a>{' '}
                  syntax to create page content
                  <br />
                  You can also embed advanced components like maps, charts and document lists in
                  your page.&nbsp;
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/huridocs/uwazi/wiki/Components"
                  >
                    Click here
                  </a>{' '}
                  to learn more about the components.
                </div>
              </div>
              <div>
                <div>
                  <span className="form-group-label">Page Javascript</span>
                </div>
                <div className="alert alert-warning">
                  <Icon icon="exclamation-triangle" size="2x" />
                  <div className="force-ltr">
                    With great power comes great responsibility!
                    <br />
                    <br />
                    This area allows you to append custom Javascript to the page. This opens up a
                    new universe of possibilities.
                    <br />
                    It could also very easily break the app. Only write code here if you know
                    exactly what you are doing.
                  </div>
                </div>
                <Field model=".metadata.script">
                  <textarea
                    placeholder="// Javascript - With great power comes great responsibility!"
                    className="form-control"
                    rows={12}
                  />
                </Field>
              </div>
            </div>
          </div>
          <div className="settings-footer">
            <BackButton to={backUrl} />
            <button type="submit" className="btn btn-success save-template" disabled={!!savingPage}>
              <Icon icon="save" />
              <span className="btn-label">Save</span>
            </button>
          </div>
        </Form>
      </div>
    );
  }
}

PageCreator.propTypes = {
  resetPage: PropTypes.func,
  savePage: PropTypes.func,
  page: PropTypes.object,
  formState: PropTypes.object,
  savingPage: PropTypes.bool,
};

function mapStateToProps({ page }) {
  return { page, formState: page.formState, savingPage: page.uiState.get('savingPage') };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetPage: resetPageAction, savePage: savePageAction }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PageCreator);
