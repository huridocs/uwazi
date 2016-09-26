import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';
import marked from 'marked';

export class ShowMetadata extends Component {
  getValue(property) {
    if (property.url) {
      return <Link to={property.url}>{property.value}</Link>;
    }
    if (typeof property.value === 'object') {
      console.log(property.value);
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
