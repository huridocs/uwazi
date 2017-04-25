import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {publishEntity} from 'app/Uploads/actions/uploadsActions';
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

  onClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.entity, this.props.active);
    }
  }


  render() {
    let entity = this.props.entity.toJS();

    return (
      <RowList.Item status="success" active={this.props.active} onClick={this.onClick.bind(this)}>
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
          <a className="item-shortcut btn btn-default btn-hover-success" onClick={this.publish.bind(this)}>
            <span className="itemShortcut-arrow">
              <i className="fa fa-send"></i>
            </span>
          </a>
          &nbsp;
          <I18NLink to={`/entity/${entity.sharedId}`} className="item-shortcut btn btn-default" onClick={(e) => e.stopPropagation()}>
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
  loadInReduxForm: PropTypes.func,
  templates: PropTypes.object,
  onClick: PropTypes.func,
  publishEntity: PropTypes.func
};

UploadEntity.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state, props) {
  return {
    active: !!state.uploads.uiState.get('selectedDocuments').find((doc) => doc.get('_id') === props.entity.get('_id')),
    templates: state.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadInReduxForm: actions.loadInReduxForm, publishEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadEntity);
