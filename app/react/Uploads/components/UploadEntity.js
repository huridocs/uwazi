import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {editEntity, finishEditEntity, publishEntity} from 'app/Uploads/actions/uploadsActions';
import {Link} from 'react-router';
import entities from 'app/Entities';

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

  edit(entity, active) {
    if (active) {
      return this.props.finishEditEntity();
    }

    this.props.editEntity(entity, this.props.templates.toJS());
  }

  render() {
    let entity = this.props.entity.toJS();
    let active;
    if (this.props.entityBeingEdited) {
      active = this.props.entityBeingEdited === entity._id;
    }

    return (
      <RowList.Item status="success" active={active} onClick={this.edit.bind(this, entity, active)}>
      <div className="item-info">
        <ItemName>{entity.title}</ItemName>
      </div>
      <ItemFooter onClick={this.publish.bind(this)}>
        <ItemFooter.Label status="success">Ready to publish</ItemFooter.Label>
        <Link to={`/entity/${entity._id}`} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
          <i className="fa fa-file-o"></i><span>View</span><i className="fa fa-angle-right"></i>
        </Link>
      </ItemFooter>
    </RowList.Item>
    );
  }
}

UploadEntity.propTypes = {
  entity: PropTypes.object,
  entityBeingEdited: PropTypes.string,
  loadEntity: PropTypes.func,
  finishEditEntity: PropTypes.func,
  templates: PropTypes.object,
  editEntity: PropTypes.func,
  publishEntity: PropTypes.func
};

UploadEntity.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    templates: state.uploads.templates,
    entityBeingEdited: state.uploads.uiState.get('entityBeingEdited')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({finishEditEntity, editEntity, loadEntity: entities.actions.loadEntity, publishEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadEntity);
