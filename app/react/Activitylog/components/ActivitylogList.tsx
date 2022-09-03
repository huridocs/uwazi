import React from 'react';

import { connect, ConnectedProps } from 'react-redux';
import { Translate } from 'app/I18N';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { IImmutable } from 'shared/types/Immutable';
import { ActivitylogRow } from './ActivitylogRow';

const mapStateToProps = ({
  activitylog,
}: {
  activitylog: { list: IImmutable<ActivityLogEntryType>[] };
}) => ({
  list: activitylog.list,
});

const connector = connect(mapStateToProps);
type mappedProps = ConnectedProps<typeof connector>;

const ActivityLogListComponent = ({ list }: mappedProps) => (
  <div className="activity-log-list">
    <table className="table">
      <thead>
        <tr>
          <th>
            <Translate>Action</Translate>
          </th>
          <th>
            <Translate>User</Translate>
          </th>
          <th className="activitylog-description">
            <Translate>Description</Translate>
          </th>
          <th className="activitylog-time">
            <Translate>Time</Translate>
          </th>
        </tr>
      </thead>
      <tbody>
        {list.map(entry => (
          <ActivitylogRow entry={entry} key={entry.get('_id').toString()} />
        ))}
      </tbody>
    </table>
  </div>
);

const container = connector(ActivityLogListComponent);
export { container as ActivitylogList };
