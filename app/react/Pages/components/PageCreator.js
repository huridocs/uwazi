import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {Form} from 'react-redux-form';
import {FormField, MarkDown} from 'app/Forms';

import {resetPage, savePage} from 'app/Pages/actions/pageActions';
import validator from './ValidatePage';

export class PageCreator extends Component {

  componentWillUnmount() {
    this.props.resetPage();
  }

  render() {
    const {formState} = this.props;
    let backUrl = '/settings/pages';

    let nameGroupClass = 'template-name form-group';
    if (formState.fields.title && !formState.fields.title.valid && (formState.submitFailed || formState.fields.title.dirty)) {
      nameGroupClass += ' has-error';
    }

    return (
      <div className="account-settings">
        <div className="panel panel-default">
          <Form
            model="page.data"
            onSubmit={this.props.savePage}
            validators={validator()}>
            <div className="metadataTemplate-heading panel-heading">
              <Link to={backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>&nbsp;
              <div className={nameGroupClass}>
                <FormField model="page.data.title">
                  <input placeholder="Page name" className="form-control"/>
                </FormField>
              </div>
              &nbsp;
              <button type="submit" className="btn btn-success save-template">
                <i className="fa fa-save"></i> Save
              </button>
            </div>
            <div className="panel-body">
              <div className="alert alert-info">
                <i className="fa fa-terminal"></i> http...
              </div>
              <FormField model="page.data.metadata.content">
                <MarkDown rows={18} />
              </FormField>
            </div>
          </Form>
        </div>
      </div>
    );
  }
}

PageCreator.propTypes = {
  resetPage: PropTypes.func,
  savePage: PropTypes.func,
  page: PropTypes.object,
  formState: PropTypes.object
};

PageCreator.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state) {
  return {page: state.page, formState: state.page.formState};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetPage, savePage}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PageCreator);
