import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {I18NLink} from 'app/I18N';
import t from 'app/I18N/t';
import ShowIf from 'app/App/ShowIf';
import marked from 'app/utils/marked';
import {Icon} from 'app/Layout/Icon';
import {TemplateLabel} from 'app/Layout';

import TimelineViewer from 'app/Timeline/components/TimelineViewer';
import {caseTemplate, matterTemplate} from 'app/Timeline/utils/timelineFixedData';

export class ShowMetadata extends Component {
  getValue(property) {
    property.value = property.value || '';

    if (property.url) {
      return <I18NLink to={property.url}>
               <Icon className="item-icon item-icon-center" data={property.icon} />
               {property.value}
             </I18NLink>;
    }

    if (typeof property.value === 'object' && !property.value.length) {
      return;
    }

    if (typeof property.value === 'object') {
      return <ul className={property.type === 'multidate' || property.type === 'multidaterange' ? 'multiline' : 'comma-separated'}>
               {property.value.map((value, indx) => {
                 if (value.url) {
                   return <li key={indx}><I18NLink to={value.url}>{value.value}</I18NLink></li>;
                 }
                 return <li key={indx}>{value.value}</li>;
               })}
             </ul>;
    }

    if (property.markdown) {
      return <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown)}}/>;
    }

    if (property.value) {
      return property.value;
    }
  }

  render() {
    const {entity, showTitle, showType} = this.props;
    let header = '';
    if (showTitle || showType) {
      let title = '';
      if (showTitle) {
        title = <div>
                  <Icon className="item-icon item-icon-center" data={entity.icon} />
                  <h1 className="item-name">{entity.title}</h1>
                </div>;
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

        {entity.metadata.map((property, index) => {
          const value = this.getValue(property);
          if (!value) {
            return false;
          }
          return (
            <dl key={index}>
              <dt>{t(entity.template, property.label)}</dt>
              <dd>{value}</dd>
            </dl>
          );
        })}
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

const mapStateToProps = ({templates}) => {
  return {templates};
};

export default connect(mapStateToProps)(ShowMetadata);
