import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';
import marked from 'marked';

export class ShowMetadata extends Component {
  render() {
    const {entity} = this.props;
    return (
        <div className="view">
          <dl>
            <dt>Title</dt>
            <dd>{entity.title}</dd>
          </dl>
          <dl>
            <dt>Type</dt>
            <dd>{entity.documentType}</dd>
          </dl>

          {entity.metadata.map((property, index) => {
            return (
              <dl key={index}>
                <dt>{property.label}</dt>
                <dd>
                {(() => {
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
                    return <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown, {sanitize: true})}}/>
                  }
                  return property.value;
                })()}
                </dd>
              </dl>
              );
          })}
        </div>
    );
  }
}

ShowMetadata.propTypes = {
  entity: PropTypes.object
};

export default ShowMetadata;
