import { fromJS as Immutable } from 'immutable';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { I18NLink } from 'app/I18N';
import { Icon } from 'app/Layout/Icon';
import { TemplateLabel, DocumentLanguage } from 'app/Layout';
import { caseTemplate, matterTemplate } from 'app/Timeline/utils/timelineFixedData';
import MarkdownViewer from 'app/Markdown';
import ShowIf from 'app/App/ShowIf';
import TimelineViewer from 'app/Timeline/components/TimelineViewer';

import FormatMetadata from '../containers/FormatMetadata';

export class ShowMetadata extends Component {
  getValue(property) {
    property.value = property.value || '';

    if (property.url) {
      return (<I18NLink to={property.url}>
        <Icon className="item-icon item-icon-center" data={property.icon} />
        {property.value}
              </I18NLink>);
    }

    if (typeof property.value === 'object' && !property.value.length) {
      return;
    }

    if (typeof property.value === 'object') {
      return (<ul className="multiline">
        {property.value.map((value, indx) => {
                 if (value.url) {
                   return <li key={indx}><I18NLink to={value.url}>{value.value}</I18NLink></li>;
                 }
                 return <li key={indx}>{value.value}</li>;
               })}
              </ul>);
    }

    if (property.markdown) {
      return <MarkdownViewer markdown={property.markdown}/>;
    }

    if (property.value) {
      return property.value;
    }
  }

  render() {
    const { entity, showTitle, showType } = this.props;
    let header = '';
    if (showTitle || showType) {
      let title = '';
      if (showTitle) {
        title = (<div>
          <Icon className="item-icon item-icon-center" data={entity.icon} />
          <h1 className="item-name">
            {entity.title}
            <DocumentLanguage doc={Immutable(entity)} />
          </h1>
                 </div>);
      }
      const type = showType ? <TemplateLabel template={entity.template}/> : '';
      header = <div className="item-info">{title}{type}</div>;
    }

    return (
      <div className="view">
        {header}

        <ShowIf if={entity.template === caseTemplate || entity.template === matterTemplate}>
          <dl>
            <dd><TimelineViewer entity={entity} /></dd>
          </dl>
        </ShowIf>
        <FormatMetadata entity={entity} />
      </div>
    );
  }
}

ShowMetadata.propTypes = {
  entity: PropTypes.object,
  templates: PropTypes.object,
  showTitle: PropTypes.bool,
  showType: PropTypes.bool
};

const mapStateToProps = ({ templates }) => ({ templates });

export default connect(mapStateToProps)(ShowMetadata);
