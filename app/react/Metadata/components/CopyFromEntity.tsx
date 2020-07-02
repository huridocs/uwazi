import React, { Component } from 'react';

import { EntitySchema } from 'shared/types/entityType';
import { SearchEntities } from './SearchEntities';
import FormatMetadata from '../containers/FormatMetadata';
import { TemplateSchema } from 'shared/types/templateType';
import { IImmutable } from 'shared/types/Immutable';
import comonProperties from 'shared/comonProperties';
import { actions } from 'react-redux-form';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

export type CopyFromEntityProps = {
  onSelect: Function;
  onCancel: Function;
  templates: IImmutable<Array<TemplateSchema>>;
  originalTemplateId: string;
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
        this.props.originalTemplateId,
        copyFromTemplateId,
      ])
      .map(p => p.name);

    this.setState({ selectedEntity, propsToCopy });
    this.props.onSelect(propsToCopy, selectedEntity);
  }

  copy() {
    const values = this.state.propsToCopy.reduce(
      (values: { [key: string]: any }, propName: string) => {
        values[propName] = this.state.selectedEntity[propName];
        return values;
      },
      {}
    );

    actions.merge(this.props.formModel, values);
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
