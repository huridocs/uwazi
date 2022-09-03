/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import moment from 'moment';

import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { IImmutable } from 'shared/types/Immutable';
import DescriptionWrapper from './DescriptionWrapper';

const methodColor = {
  UPDATE: 'btn-color-6',
  DELETE: 'btn-color-2',
  RAW: 'btn-color-17',
  MIGRATE: 'btn-color-12',
  WARNING: 'btn-color-13',
};

const MethodLabel = ({ method }: { method: keyof typeof methodColor }) => (
  <span className={`badge ${methodColor[method] || 'btn-color-13'}`}>
    <Translate>{method}</Translate>
    {method === 'WARNING' && <Icon icon="exclamation-triangle" />}
  </span>
);

const ActivitylogRow = ({ entry }: { entry: IImmutable<ActivityLogEntryType> }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const time = `${moment(entry.get('time')).format('L')} ${moment(entry.get('time'))
    .locale('en')
    .format('LTS')}`;
  const semanticData = entry.get('semantic').toJS();
  return (
    <tr
      className={semanticData.action === 'RAW' ? 'activitylog-raw' : 'activitylog-beautified'}
      key={entry.get('_id').toString()}
    >
      <td>
        <MethodLabel method={semanticData.action} />
      </td>
      <td className={!entry.get('username') ? 'color-0' : ''}>
        {entry.get('username') || 'anonymous'}
      </td>
      <td>
        <DescriptionWrapper entry={entry} toggleExpand={toggleExpand} expanded={expanded}>
          <span>
            {semanticData.description && (
              <span className="activitylog-prefix">
                <Translate>{semanticData.description}</Translate>
              </span>
            )}
            {semanticData.name && <span className="activitylog-name">{semanticData.name}</span>}
            {semanticData.extra && <span className="activitylog-extra">{semanticData.extra}</span>}
          </span>
        </DescriptionWrapper>
      </td>
      <td className="activitylog-time">{time}</td>
    </tr>
  );
};

export { ActivitylogRow };
