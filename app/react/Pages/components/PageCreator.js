import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {resetPage, savePage} from 'app/Pages/actions/pageActions';
// import PropertyOption from 'app/Templates/components/PropertyOption';
// import MetadataTemplate from 'app/Templates/components/MetadataTemplate';
import {Form} from 'react-redux-form';

import {Link} from 'react-router';
import {FormField, MarkDown} from 'app/Forms';

import validator from './ValidatePage';

// import 'app/Templates/scss/templates.scss';

export class TemplateCreator extends Component {

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
            className="metadataTemplate panel-default panel"
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
              <MarkDown value="" rows={18} />
            </div>
          </Form>
        </div>
      </div>

      // <div className="row metadata">
      //   <main className="col-xs-12 col-sm-9">
      //       <MetadataTemplate saveTemplate={save} backUrl={backUrl} />
      //   </main>
      //   <aside className="col-xs-12 col-sm-3">
      //     <div className="metadataTemplate-constructor panel panel-default">
      //       <div className="panel-heading">Properties</div>
      //       <ul className="list-group">
      //         <PropertyOption label='Text' type='text'/>
      //         <PropertyOption label='Select' type='select'/>
      //         <PropertyOption label='Multi Select' type='multiselect'/>
      //         <PropertyOption label='Date' type='date'/>
      //         <PropertyOption label='Rich Text' type='markdown'/>
      //       </ul>
      //     </div>
      //   </aside>
      // </div>

    );
  }
}

TemplateCreator.propTypes = {
  resetPage: PropTypes.func,
  savePage: PropTypes.func,
  page: PropTypes.object,
  formState: PropTypes.object
};

TemplateCreator.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state) {
  return {page: state.page, formState: state.page.formState};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetPage, savePage}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TemplateCreator);
