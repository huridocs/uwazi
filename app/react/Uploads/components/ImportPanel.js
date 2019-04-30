import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import { Translate } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { Icon } from 'UI';
import { LocalForm, Control } from 'react-redux-form';
import { closeImportPanel } from 'app/Uploads/actions/uploadsActions';


export class ImportPanel extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  close() {
    this.props.closeImportPanel();
  }

  handleSubmit(values) {
    console.log(values);
  }

  render() {
    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel">
        <div className="sidepanel-header">
          <button className="closeSidepanel close-modal" onClick={this.close.bind(this)}>
            <Icon icon="times" />
          </button>
        </div>
        <LocalForm onSubmit={this.handleSubmit}>
          <div className="form-group">
            <ul className="search__filter">
              <label>Template</label>
              <Control.select model=".template" >
                {this.props.templates.map(t => <option value={t.get('_id')}>{t.get('name')}</option>)}
              </Control.select>
            </ul>
          </div>
          <div className="form-group" />
        </LocalForm>
      </SidePanel>
    );
  }
}

ImportPanel.defaultProps = {
  open: false,
};

ImportPanel.propTypes = {
  open: PropTypes.bool,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  closeImportPanel: PropTypes.func.isRequired
};

export const mapStateToProps = state => ({
    open: state.importEntities.showImportPanel,
    templates: state.templates
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ closeImportPanel }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportPanel);
