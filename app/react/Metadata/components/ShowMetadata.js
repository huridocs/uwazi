import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';
import ShowIf from 'app/App/ShowIf';
import marked from 'marked';

import TimelineViewer from 'app/Timeline/components/TimelineViewer';

export class ShowMetadata extends Component {
  getValue(property) {
    if (property.url) {
      return <Link to={property.url}>{property.value}</Link>;
    }

    if (typeof property.value === 'object') {
      return <ul>
               {property.value.map((value, indx) => {
                 if (value.url) {
                   return <li key={indx}><Link to={value.url}>{value.value}</Link></li>;
                 }
                 return <li key={indx}>{value.value}</li>;
               })}
             </ul>;
    }

    if (property.markdown) {
      return <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown, {sanitize: true})}}/>;
    }

    return property.value;
  }

  render() {
    const {entity, showTitle, showType} = this.props;

    return (
      <div className="view">
        {showTitle ? <dl><dt>Title</dt><dd>{entity.title}</dd></dl> : ''}
        {showType ? <dl><dt>Type</dt><dd>{entity.documentType}</dd></dl> : ''}

        <ShowIf if={entity.template === 'cd951f1feec188a75916812d43252418'}>
          <dl>
            <dd><TimelineViewer entity={entity} /></dd>
          </dl>
        </ShowIf>

        {entity.metadata.map((property, index) => {
          return (
            <dl key={index}>
              <dt>{property.label}</dt>
              <dd>{this.getValue(property)}</dd>
            </dl>
          );
        })}
      </div>
    );
  }
}

ShowMetadata.propTypes = {
  entity: PropTypes.object,
  showTitle: PropTypes.bool,
  showType: PropTypes.bool
};

export default ShowMetadata;
