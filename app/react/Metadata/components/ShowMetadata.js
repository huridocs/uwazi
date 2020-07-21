/** @format */

import ShowIf from 'app/App/ShowIf';
import { DocumentLanguage, TemplateLabel } from 'app/Layout';
import { Icon } from 'app/Layout/Icon';
import TimelineViewer from 'app/Timeline/components/TimelineViewer';
import { caseTemplate, matterTemplate } from 'app/Timeline/utils/timelineFixedData';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormatMetadata } from '../containers/FormatMetadata';

export class ShowMetadata extends Component {
  render() {
    const { entity, showTitle, showType, relationships, showSubset } = this.props;
    let header = '';
    if (showTitle || showType) {
      let title = '';
      if (showTitle) {
        title = (
          <div>
            <Icon className="item-icon item-icon-center" data={entity.icon} />
            <h1 className="item-name">
              {entity.title}
              <DocumentLanguage doc={Immutable.fromJS(entity)} />
            </h1>
          </div>
        );
      }
      const type = showType ? <TemplateLabel template={entity.template} /> : '';
      header = (
        <div className="item-info">
          {title}
          {type}
        </div>
      );
    }

    return (
      <div className="view">
        {header}

        <ShowIf if={entity.template === caseTemplate || entity.template === matterTemplate}>
          <dl className="metadata-timeline-viewer">
            <dd>
              <TimelineViewer entity={entity} />
            </dd>
          </dl>
        </ShowIf>
        <FormatMetadata entity={entity} relationships={relationships} showSubset={showSubset} />
      </div>
    );
  }
}
ShowMetadata.defaultProps = {
  showSubset: undefined,
};

ShowMetadata.propTypes = {
  entity: PropTypes.object,
  relationships: PropTypes.object,
  templates: PropTypes.object,
  showTitle: PropTypes.bool,
  showType: PropTypes.bool,
  showSubset: PropTypes.arrayOf(PropTypes.string),
};

const mapStateToProps = ({ templates }) => ({ templates });

export default connect(mapStateToProps)(ShowMetadata);
