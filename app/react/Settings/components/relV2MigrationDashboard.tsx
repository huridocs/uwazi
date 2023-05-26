import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { ClientTemplateSchema, IStore, RelationshipTypesType } from 'app/istore';
import {
  sendMigrationRequest as _sendMigrationRequest,
  testOneHub as _testOneHub,
} from 'app/Entities/actions/V2NewRelationshipsActions';
import { Icon } from 'app/UI';
import { objectIndex } from 'shared/data_utils/objectIndex';

type RelationshipType = {
  template?: string;
  relationType?: string;
  content?: string;
};

type MigrationSummaryType = {
  total: number;
  used: number;
  time: number;
  dryRun: boolean;
};

type hubTestResult = {
  total: number;
  used: number;
  transformed: {
    from: { entity: string };
    to: { entity: string };
    type: string;
  }[];
  original: {
    entity: string;
    entityTemplate: string;
    entityTitle: string;
    hub: string;
    id: string;
    template: string;
    templateName: string;
  }[];
};

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

const formatTime = (time: number) => {
  const floored = Math.floor(time);
  if (floored < 1000) {
    return `${floored}ms`;
  }
  return `${(floored / 1000).toFixed(2)}s`;
};

class _NewRelMigrationDashboard extends React.Component<ComponentPropTypes> {
  private migrationSummary?: MigrationSummaryType;

  private testedHub?: string;

  private hubTestResult?: hubTestResult;

  async performDryRun() {
    const summary = await _sendMigrationRequest(true);
    this.migrationSummary = summary;
    this.forceUpdate();
  }

  async performMigration() {
    const summary = await _sendMigrationRequest();
    this.migrationSummary = summary;
    this.forceUpdate();
  }

  async storeTestedHub(event: React.ChangeEvent<HTMLInputElement>) {
    this.testedHub = event.target.value;
  }

  async testOneHub() {
    const testresult = await _testOneHub(this.testedHub);
    this.hubTestResult = testresult;
    this.forceUpdate();
  }

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
    const oneHubTestEntityTitlesBySharedId = objectIndex(
      this.hubTestResult?.original || [],
      t => t.entity,
      t => t.entityTitle
    );
    const oneHubRelTypeNamesById = objectIndex(
      this.hubTestResult?.original || [],
      t => t.template,
      t => t.templateName
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
            <button type="button" className="btn" onClick={this.performDryRun.bind(this)}>
              Dry Run
            </button>
            &emsp;
            <button type="button" className="btn" onClick={this.performMigration.bind(this)}>
              Migrate
            </button>
            <br />
            <br />
            {this.migrationSummary && (
              <div>
                <br />
                <div>Migration Summary{this.migrationSummary.dryRun ? ' (Dry Run)' : ''}:</div>
                <div>Time: {formatTime(this.migrationSummary.time)}</div>
                <div>Total: {this.migrationSummary.total}</div>
                <div>Used: {this.migrationSummary.used}</div>
                <div>Unused: {this.migrationSummary.total - this.migrationSummary.used}</div>
              </div>
            )}
            <br />
            <div>Relationships infered from v1 relationship properties:</div>
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
            <br />
            <br />
            <button type="button" onClick={this.testOneHub.bind(this)}>
              Test One Hub
            </button>
            <input type="text" onChange={this.storeTestedHub.bind(this)} />
            {this.hubTestResult && (
              <div>
                <div>Test Result:</div>
                <div>Total: {this.hubTestResult.total}</div>
                <div>Used: {this.hubTestResult.used}</div>
                <div>Unused: {this.hubTestResult.total - this.hubTestResult.used}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Original Hub</th>
                      <th>Transformed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {this.hubTestResult.original.map(t => (
                          <div key={`${t.template}_${t.entity}`}>
                            {oneHubRelTypeNamesById[t.template]}&emsp;
                            <Icon icon="link" />
                            &emsp;
                            {oneHubTestEntityTitlesBySharedId[t.entity]}
                          </div>
                        ))}
                      </td>
                      <td>
                        {this.hubTestResult.transformed.map(t => (
                          <div key={`${t.from.entity}_${t.to.entity}_${t.type}`}>
                            {oneHubTestEntityTitlesBySharedId[t.from.entity]}&emsp;
                            <Icon icon="arrow-right" />
                            &emsp;
                            {oneHubRelTypeNamesById[t.type]}&emsp;
                            <Icon icon="arrow-right" />
                            &emsp;
                            {oneHubTestEntityTitlesBySharedId[t.to.entity]}
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
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
