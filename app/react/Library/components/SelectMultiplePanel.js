import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {t} from 'app/I18N';
import {unselectAllDocuments} from 'app/Library/actions/libraryActions';
import {deleteEntities} from 'app/Entities/actions/actions';

import {TemplateLabel, SidePanel} from 'app/Layout';

export class SelectMultiplePanel extends Component {

  close() {
    this.context.confirm({
      accept: () => {
        this.props.unselectAllDocuments();
      },
      title: t('System', 'Confirm'),
      message: t('System', 'This will unselect all the entities, are you sure?')
    });
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.deleteEntities(this.props.entitiesSelected.toJS());
      },
      title: t('System', 'Confirm'),
      message: t('System', 'Are you sure you want to delete all the selected items?')
    });
  }

  save() {

  }

  edit() {

  }

  render() {
    const {entitiesSelected, open} = this.props;

    return (
      <SidePanel open={open} className="metadata-sidepanel">
        <div className="sidepanel-header">
        <span>{entitiesSelected.size} {t('System', 'selected')}.</span>
        <i className="closeSidepanel fa fa-close close-modal" onClick={this.close.bind(this)}/>&nbsp;
        </div>
        <div className="sidepanel-body">
          <ul className="entities-list">
            {entitiesSelected.map((entity, index) => {
              return <li key={index}><TemplateLabel template={entity.get('template')}/> <span>{entity.get('title')}</span></li>;
            })}
          </ul>
        </div>
        <div className="sidepanel-footer">
          <button className="edit btn btn-primary" onClick={this.edit.bind(this)}>
            <i className="fa fa-pencil"></i>
            <span className="btn-label">{t('System', 'Edit')}</span>
          </button>
          <button className="delete btn btn-danger" onClick={this.delete.bind(this)}>
            <i className="fa fa-trash"></i>
            <span className="btn-label">{t('System', 'Delete')}</span>
          </button>
        </div>
      </SidePanel>
    );
  }
}

SelectMultiplePanel.propTypes = {
  entitiesSelected: PropTypes.object,
  open: PropTypes.bool,
  unselectAllDocuments: PropTypes.func,
  deleteEntities: PropTypes.func
};

SelectMultiplePanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = (state) => {
  const library = state.library;
  return {
    open: library.ui.get('selectedDocuments').size > 1,
    entitiesSelected: library.ui.get('selectedDocuments')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectAllDocuments, deleteEntities}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
