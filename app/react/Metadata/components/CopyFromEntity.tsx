import React, { Component } from 'react';

import { EntitySchema } from 'shared/types/entityType';
import { SearchEntities } from './SearchEntities';
import FormatMetadata from '../containers/FormatMetadata';
import { TemplateSchema } from 'shared/types/templateType';
import { IImmutable } from 'shared/types/Immutable';
import comonProperties from 'shared/comonProperties';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions } from 'app/Metadata';
import { store } from 'app/store';

export type CopyFromEntityProps = {
  onSelect: Function;
  onCancel: Function;
  templates: IImmutable<Array<TemplateSchema>>;
  originalEntity: EntitySchema;
  formModel: string;
};

export type CopyFromEntityState = {
  selectedEntity: EntitySchema;
  propsToCopy: Array<string>;
};

export class CopyFromEntity extends Component<CopyFromEntityProps, CopyFromEntityState> {
  constructor(props: CopyFromEntityProps) {
    super(props);
    this.state = { propsToCopy: [], selectedEntity: {} };
    this.onSelect = this.onSelect.bind(this);
    this.cancel = this.cancel.bind(this);
    this.copy = this.copy.bind(this);
    this.backToSearch = this.backToSearch.bind(this);
  }

  onSelect(selectedEntity: EntitySchema) {
    const copyFromTemplateId = selectedEntity.template;

    const propsToCopy = comonProperties
      .comonProperties(this.props.templates.toJS(), [
        this.props.originalEntity.template,
        copyFromTemplateId,
      ])
      .map(p => p.name);

    this.setState({ selectedEntity, propsToCopy });
    this.props.onSelect(propsToCopy, selectedEntity);
  }

  copy() {
    if (!this.state.selectedEntity.metadata) {
      return;
    }

    const updatedEntity = this.state.propsToCopy.reduce(
      (updatedEntity: EntitySchema, propName: string) => {
        if (!updatedEntity.metadata) {
          updatedEntity.metadata = {};
        }

        updatedEntity.metadata[propName] = this.state.selectedEntity.metadata![propName];
        return updatedEntity;
      },
      { ...this.props.originalEntity }
    );

    actions
      .loadFetchedInReduxForm(this.props.formModel, updatedEntity, this.props.templates.toJS())
      .forEach(action => store?.dispatch(action));

    this.props.onSelect([]);
    this.props.onCancel();
  }

  backToSearch() {
    this.setState({ propsToCopy: [], selectedEntity: {} });
    this.props.onSelect([]);
  }

  cancel() {
    this.props.onCancel();
  }

  renderPanel() {
    return this.state.selectedEntity._id ? (
      <React.Fragment>
        <div className="view">
          <FormatMetadata entity={this.state.selectedEntity} highlight={this.state.propsToCopy} />
        </div>
        <div className="copy-from-buttons">
          <button className="back-copy-from btn btn-light" onClick={this.backToSearch}>
            <Icon icon="arrow-left" />
            <span className="btn-label">
              <Translate>Back to search</Translate>
            </span>
          </button>
          <button className="cancel-copy-from btn btn-primary" onClick={this.cancel}>
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
          <button className="copy-copy-from btn btn-success" onClick={this.copy}>
            <Icon icon="clone" />
            <span className="btn-label">
              <Translate>Copy Highlighted</Translate>
            </span>
          </button>
        </div>
      </React.Fragment>
    ) : (
      <React.Fragment>
        <SearchEntities onSelect={this.onSelect} />
        <div className="copy-from-buttons">
          <button className="cancel-copy-from btn btn-primary" onClick={this.cancel}>
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
        </div>
      </React.Fragment>
    );
  }

  render() {
    return <div className="copy-from">{this.renderPanel()}</div>;
  }
}
