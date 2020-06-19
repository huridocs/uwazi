import React, { Component } from 'react';

import { EntitySchema } from 'shared/types/entityType';
import { SearchEntities } from './SearchEntities';
import FormatMetadata from '../containers/FormatMetadata';
import { TemplateSchema } from 'shared/types/templateType';
import { IImmutable } from 'shared/types/Immutable';
import comonProperties from 'shared/comonProperties';

export type CopyFromEntityProps = {
  onSelect: Function;
  templates: IImmutable<Array<TemplateSchema>>;
  originalTemplateId: string;
};

export type CopyFromEntityState = {
  selectedEntity?: EntitySchema;
  propsToCopy: Array<string>;
};

export class CopyFromEntity extends Component<CopyFromEntityProps, CopyFromEntityState> {
  constructor(props: CopyFromEntityProps) {
    super(props);
    this.state = { propsToCopy: [] };
    this.onSelect = this.onSelect.bind(this);
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
  }

  renderPanel() {
    return this.state.selectedEntity ? (
      <div className="view">
        <FormatMetadata entity={this.state.selectedEntity} />
      </div>
    ) : (
      <SearchEntities onSelect={this.onSelect} />
    );
  }

  render() {
    return <div className="copy-from">{this.renderPanel()}</div>;
  }
}
