import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { ClientTemplateSchema, IStore, RelationshipTypesType } from 'app/istore';
import { sendMigrationRequest as _sendMigrationRequest } from 'app/Entities/actions/V2NewRelationshipsActions';
import { Icon } from 'app/UI';
import { objectIndex as _objectIndex } from 'shared/data_utils/objectIndex';

type RelationshipType = {
  template?: string;
  relationType?: string;
  content?: string;
};

const objectIndex = _.memoize(_objectIndex);

const inferFromV1 = (
  templates: ClientTemplateSchema[],
  templateIndex: Record<string, ClientTemplateSchema>,
  relationTypeIndex: Record<string, RelationshipTypesType>
) => {
  const arr =
    templates
      .map(t => t.properties?.map(p => ({ ...p, template: t._id })) || [])
      .flat()
      .filter(p => p.type === 'relationship')
      .map(p => ({
        template: templateIndex[p.template].name,
        relationType: p.relationType ? relationTypeIndex[p.relationType].name : undefined,
        content: p.content ? templateIndex[p.content].name : 'ALL',
      })) || [];

  const unique = _.uniqWith(
    arr,
    (a, b) =>
      a.template === b.template && a.relationType === b.relationType && a.content === b.content
  );

  const sorted = _.sortBy(unique, ['template', 'relationType', 'content']);

  return sorted;
};

const performDryRun = () => {
  _sendMigrationRequest(true);
};

const performMigration = () => {
  _sendMigrationRequest();
};

class _NewRelMigrationDashboard extends React.Component<ComponentPropTypes> {
  render() {
    const templatesById = objectIndex(
      this.props.templates,
      t => t._id,
      t => t
    );
    const relationTypesById = objectIndex(
      this.props.relationTypes,
      t => t._id,
      t => t
    );
    const inferedRelationships: RelationshipType[] = inferFromV1(
      this.props.templates,
      templatesById,
      relationTypesById
    );

    return (
      <div className="settings-content">
        <div className="panel panel-default">
          <div className="panel-heading">
            <span>Migration Dashboard</span>
          </div>
          <div className="panel-body">
            <button type="button" className="btn" onClick={performDryRun}>
              Dry Run
            </button>
            &emsp;
            <button type="button" className="btn" onClick={performMigration}>
              Migrate
            </button>
            <br />
            <br />
            <div>Relationships infered from v1 relationship properties</div>
            <br />
            {inferedRelationships.map(p => (
              <div key={`${p.template}_${p.relationType}_${p.content}`}>
                {p.template}&emsp;
                <Icon icon="arrow-right" />
                &emsp;
                {p.relationType}&emsp;
                <Icon icon="arrow-right" />
                &emsp;
                {p.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

type ComponentPropTypes = {
  templates: ClientTemplateSchema[];
  relationTypes: RelationshipTypesType[];
};

const mapStateToProps = ({ templates, relationTypes }: IStore) => ({
  templates: templates.toJS(),
  relationTypes: relationTypes.toJS(),
});

const NewRelMigrationDashboard = connect(mapStateToProps)(_NewRelMigrationDashboard);

export { NewRelMigrationDashboard };
export type { ComponentPropTypes };
