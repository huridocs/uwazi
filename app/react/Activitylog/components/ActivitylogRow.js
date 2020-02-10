import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Map } from 'immutable';
import DescriptionWrapper from './DescriptionWrapper';

const label = method => {
  switch (method) {
    case 'CREATE':
      return <span className="badge btn-color-9">{method}</span>;
    case 'UPDATE':
      return <span className="badge btn-color-6">{method}</span>;
    case 'DELETE':
      return <span className="badge btn-color-2">{method}</span>;
    case 'RAW':
      return <span className="badge btn-color-17">{method}</span>;
    default:
      return <span className="badge btn-color-17">{method}</span>;
  }
};

class ActivitylogRow extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.toggleExpand = this.toggleExpand.bind(this);
  }

  toggleExpand() {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  render() {
    const { entry } = this.props;
    const { expanded } = this.state;

    const time = `${moment(entry.get('time')).format('L')} ${moment(entry.get('time'))
      .locale('en')
      .format('LTS')}`;
    const semanticData = entry.get('semantic').toJS();

    let description = (
      <DescriptionWrapper entry={entry} toggleExpand={this.toggleExpand} expanded={expanded}>
        <span className="activitylog-extra">
          {entry.get('method')} : {entry.get('url')}
        </span>
      </DescriptionWrapper>
    );

    if (semanticData.beautified) {
      description = (
        <DescriptionWrapper entry={entry} toggleExpand={this.toggleExpand} expanded={expanded}>
          <span>
            <span className="activitylog-prefix">{semanticData.description}</span>
            <span className="activitylog-name"> {semanticData.name}</span>
            <span className="activitylog-extra"> {semanticData.extra}</span>
          </span>
        </DescriptionWrapper>
      );
    }

    return (
      <tr
        className={semanticData.beautified ? 'activitylog-beautified' : 'activitylog-raw'}
        key={entry.get('_id')}
      >
        <td>{semanticData.beautified ? label(semanticData.action) : label('RAW')}</td>
        <td>{entry.get('username') || '-'}</td>
        <td>{description}</td>
        <td className="activitylog-time">{time}</td>
      </tr>
    );
  }
}

ActivitylogRow.defaultProps = {
  entry: Map(),
};

ActivitylogRow.propTypes = {
  entry: PropTypes.instanceOf(Map),
};

export default ActivitylogRow;
