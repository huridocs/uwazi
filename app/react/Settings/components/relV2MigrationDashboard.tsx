import React from 'react';
import { connect } from 'react-redux';

import { IStore } from 'app/istore';

type ComponentPropTypes = {};

const sendMigrationRequest = () => {};

class _NewRelMigrationDashboard extends React.Component<ComponentPropTypes> {
  render() {
    return (
      <div className="settings-content">
        <div className="panel panel-default">
          <div className="panel-heading">
            <span>Migration Dashboard</span>
          </div>
          <div className="panel-body">
            <button type="button" className="btn" onClick={sendMigrationRequest}>
              Migrate
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ settings, templates }: IStore) => ({
  collectionSettings: settings.collection,
  templates,
});

const NewRelMigrationDashboard = connect(mapStateToProps)(_NewRelMigrationDashboard);

export { NewRelMigrationDashboard };
export type { ComponentPropTypes };
