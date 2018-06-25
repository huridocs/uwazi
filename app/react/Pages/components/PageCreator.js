import { Form, Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { I18NLink } from 'app/I18N';
import { MarkDown } from 'app/ReactReduxForms';
import { resetPage, savePage } from 'app/Pages/actions/pageActions';
import ShowIf from 'app/App/ShowIf';

import validator from './ValidatePage';

export class PageCreator extends Component {
  componentWillUnmount() {
    this.props.resetPage();
  }

  render() {
    const { formState, page, savingPage } = this.props;
    const backUrl = '/settings/pages';
    const pageUrl = `/page/${page.data.sharedId}`;

    let nameGroupClass = 'template-name form-group';
    if (formState.title && !formState.title.valid && (formState.submitFailed || formState.title.touched)) {
      nameGroupClass += ' has-error';
    }

    return (
      <div className="page-creator">
        <Form
          model="page.data"
          onSubmit={this.props.savePage}
          validators={validator()}
        >
          <div className="panel panel-default">
            <div className="metadataTemplate-heading panel-heading">
              <div className={nameGroupClass}>
                <Field model=".title">
                  <input placeholder="Page name" className="form-control"/>
                </Field>
              </div>
            </div>
            <div className="panel-body page-viewer document-viewer">
              <ShowIf if={Boolean(page.data._id)}>
                <div className="alert alert-info">
                  <i className="fa fa-terminal" /> {pageUrl}
                  <a target="_blank" href={pageUrl} className="pull-right">(view page)</a>
                </div>
              </ShowIf>
              <MarkDown htmlOnViewer model=".metadata.content" rows={18} />
            </div>
          </div>
          <div className="settings-footer">
            <I18NLink to={backUrl} className="btn btn-default">
              <i className="fa fa-arrow-left" />
              <span className="btn-label">Back</span>
            </I18NLink>
            <button
              type="submit"
              className="btn btn-success save-template"
              disabled={!!savingPage}
            >
              <i className="far fa-save" />
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
  savingPage: PropTypes.bool
};

function mapStateToProps({ page }) {
  return { page, formState: page.formState, savingPage: page.uiState.get('savingPage') };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resetPage, savePage }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PageCreator);
