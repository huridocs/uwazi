import { Form, Field, Control } from 'react-redux-form';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import React, { Component } from 'react';
import _ from 'lodash';

import { Icon, ToggleButton } from 'UI';
import { MarkDown } from 'app/ReactReduxForms';
import {
  resetPage as resetPageAction,
  savePage as savePageAction,
  updateValue as updateValueAction,
} from 'app/Pages/actions/pageActions';
import ShowIf from 'app/App/ShowIf';
import { BackButton } from 'app/Layout';
import { Translate, I18NLink } from 'app/I18N';

import { IStore } from 'app/istore';
import validator from './ValidatePage';

const mapStateToProps = ({ page }: IStore) => ({
  page,
  formState: page.formState,
  savingPage: page.uiState.get('savingPage'),
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    { resetPage: resetPageAction, savePage: savePageAction, updateValue: updateValueAction },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

class PageCreator extends Component<mappedProps> {
  componentWillUnmount() {
    const { resetPage } = this.props;
    resetPage();
  }

  render() {
    const { formState, page, savePage, updateValue, savingPage } = this.props;
    const backUrl = '/settings/pages';
    const pageUrl = `/page/${page.data.sharedId}/${_.kebabCase(page.data.title)}`;

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
              <div className="entity-view">
                <Translate>Enable this page to be used as an entity view page:</Translate>
                <Control
                  model=".entityView"
                  component={ToggleButton}
                  checked={Boolean(page.data.entityView)}
                  onClick={() => {
                    updateValue('.entityView', !page.data.entityView);
                  }}
                />
              </div>
              <ShowIf if={Boolean(page.data._id) && !page.data.entityView}>
                <div className="alert alert-info">
                  <Icon icon="angle-right" /> {pageUrl}
                  &nbsp;
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={pageUrl}
                    className="pull-right"
                  >
                    <Translate>(view page)</Translate>
                  </a>
                </div>
              </ShowIf>
              <MarkDown
                htmlOnViewer
                model=".metadata.content"
                rows={18}
                showPreview={!page.data.entityView}
              />
              <div className="alert alert-info">
                <Icon icon="info-circle" size="2x" />
                <div className="force-ltr">
                  <Translate>Use</Translate>{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://guides.github.com/features/mastering-markdown/"
                  >
                    <Translate>Markdown</Translate>
                  </a>{' '}
                  <Translate>syntax to create page content</Translate>
                  <br />
                  <Translate>
                    You can also embed advanced components like maps, charts and entity lists in
                    your page.
                  </Translate>
                  &nbsp;
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://uwazi.readthedocs.io/en/latest/admin-docs/analysing-and-visualising-your-collection.html"
                  >
                    <Translate>Click here</Translate>
                  </a>{' '}
                  <Translate>to learn more about the components.</Translate>
                </div>
              </div>
              <div>
                <div>
                  <span className="form-group-label">
                    <Translate>Page Javascript</Translate>
                  </span>
                </div>
                <div className="alert alert-warning">
                  <Icon icon="exclamation-triangle" size="2x" />
                  <div className="force-ltr">
                    <Translate>With great power comes great responsibility!</Translate>
                    <br />
                    <br />
                    <Translate>
                      This area allows you to append custom Javascript to the page. This opens up a
                      new universe of possibilities.
                    </Translate>
                    <br />
                    <Translate>
                      It could also very easily break the app. Only write code here if you know
                      exactly what you are doing.
                    </Translate>
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
            <div className="btn-cluster">
              <BackButton to={backUrl} className="btn-plain" />
            </div>
            <div className="btn-cluster content-right">
              <I18NLink to={backUrl} className="btn btn-extra-padding btn-default">
                <span className="btn-label">
                  <Translate>Cancel</Translate>
                </span>
              </I18NLink>
              <button
                type="submit"
                className="btn btn-extra-padding btn-success save-template"
                disabled={!!savingPage}
              >
                <span className="btn-label">
                  <Translate>Save</Translate>
                </span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

const container = connector(PageCreator);

export type { mappedProps };
export { container as PageCreator };
