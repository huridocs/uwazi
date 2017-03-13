import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {selectDocument, unselectAllDocuments, unselectDocument, publishEntity} from 'app/Uploads/actions/uploadsActions';
import {I18NLink} from 'app/I18N';
import {actions} from 'app/Metadata';
import {TemplateLabel, Icon} from 'app/Layout';

export class UploadEntity extends Component {
  publish(e) {
    e.stopPropagation();
    this.context.confirm({
      accept: () => {
        this.props.publishEntity(this.props.entity.toJS());
      },
      title: 'The entity is ready to be published: ',
      message: 'Publishing this entity will make it appear in public searches, are you sure?',
      type: 'success'
    });
  }

  select(e) {
    if (!(e.metaKey || e.ctrlKey) || !this.props.authorized) {
      this.props.unselectAllDocuments();
    }

    if (this.props.active && this.props.multipleSelected && !(e.metaKey || e.ctrlKey)) {
      this.props.loadInReduxForm('uploads.metadata', this.props.entity, this.props.templates.toJS());
      return this.props.selectDocument(this.props.entity);
    }

    if (this.props.active) {
      return this.props.unselectDocument(this.props.entity.get('_id'));
    }

    this.props.selectDocument(this.props.entity);
    this.props.loadInReduxForm('uploads.metadata', this.props.entity.toJS(), this.props.templates.toJS());
  }


  render() {
    let entity = this.props.entity.toJS();

    return (
      <RowList.Item status="success" active={this.props.active} onClick={this.select.bind(this)}>
      <div className="item-info">
        <i className="item-private-icon fa fa-lock"></i>
        <Icon className="item-icon item-icon-center" data={entity.icon} />
        <ItemName>{entity.title}</ItemName>
      </div>
      <ItemFooter>
        <div className="item-label-group">
          <TemplateLabel template={entity.template}/>
        </div>
        <div className="item-shortcut-group">
          <a className="item-shortcut item-shortcut--success" onClick={this.publish.bind(this)}>
            <span className="itemShortcut-arrow">
              <i className="fa fa-send"></i>
            </span>
          </a>
          &nbsp;
          <I18NLink to={`/entity/${entity.sharedId}`} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
            <i className="fa fa-file-text-o"></i>
          </I18NLink>
        </div>
      </ItemFooter>
    </RowList.Item>
    );
  }
}

UploadEntity.propTypes = {
  entity: PropTypes.object,
  active: PropTypes.bool,
  authorized: PropTypes.bool,
  multipleSelected: PropTypes.bool,
  loadInReduxForm: PropTypes.func,
  finishEdit: PropTypes.func,
  templates: PropTypes.object,
  selectDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func,
  unselectDocument: PropTypes.func,
  publishEntity: PropTypes.func
};

UploadEntity.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state, props) {
  return {
    active: !!state.uploads.uiState.get('selectedDocuments').find((doc) => doc.get('_id') === props.entity.get('_id')),
    multipleSelected: state.uploads.uiState.get('selectedDocuments').size > 1,
    templates: state.templates,
    authorized: !!state.user.get('_id')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectAllDocuments, unselectDocument, loadInReduxForm: actions.loadInReduxForm, publishEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadEntity);
