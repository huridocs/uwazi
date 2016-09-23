import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';

import moment from 'moment';

const countryTemplate = 'e8e039070aa95f8f964c281d450d1022';
const admissibilityReport = 'e8e039070aa95f8f964c281d4583100d';
const judgement = '5c7180d3dd310766a1c6817c165ed5f4';

export class TimelineViewer extends Component {

  fetchReferenceData(references) {
    const fetchPromises = references.map(reference => {
      let get;
      if (reference.connectedDocumentType === 'document') {
        get = DocumentsAPI.get;
      }
      if (reference.connectedDocumentType === 'entity') {
        get = EntitiesAPI.get;
      }
      return get(reference.connectedDocument);
    });

    return Promise.all(fetchPromises);
  }

  fetchSecondLevelReferences(references) {
    return Promise.all(references.map(r => ReferencesAPI.get(r.connectedDocument)));
  }

  arrangeYears(references) {
    let years = {};
    references.forEach(reference => {
      if (reference.data.template === admissibilityReport || reference.data.template === judgement) {
        const docYear = moment.utc(reference.data.metadata.fecha * 1000).format('YYYY');
        // console.log(reference.data);
        years[docYear] = years[docYear] || [];
        years[docYear].push(reference);
      }
    });

    return years;
  }

  getTimelineInfo(references) {
    // const newState = {};
    const usefulReferences = references.filter(r => r.connectedDocumentTemplate !== countryTemplate);

    this.fetchReferenceData(usefulReferences)
    .then(referencesData => {
      return Promise.all([referencesData, this.fetchSecondLevelReferences(usefulReferences)]);
    })
    .then(([referencesData, secondLevelReferences]) => {
      const stateReferences = usefulReferences.map((reference, index) => {
        return {reference, data: referencesData[index][0], children: secondLevelReferences[index]};
      });
      this.setState({references: stateReferences, years: this.arrangeYears(stateReferences)});
    });
  }

  componentDidMount() {
    this.getTimelineInfo(this.props.references.toJS());
  }

  componentWillReceiveProps(nextProps) {
    this.getTimelineInfo(nextProps.references.toJS());
  }

  render() {
    console.log('Rendered TimelineViewer');
    // let references = this.state ? this.state.references : [];
    // console.log('LOCAL STATE render:', this.state);
    let years = '';
    if (this.state) {
      years = Object.keys(this.state.years).map(year =>
        <div key={year} className="timeline-year">
          <span className="timeline-label">{year}</span>
          {this.state.years[year].map((reference, index) =>
            <span key={index} className="timeline-item" title={reference.data.title}> </span>
          )}
        </div>
      );
    }
    return (
      <div className="timeline">
        {years}
      </div>
    );

    //     <pre>
    //     {this.state ? JSON.stringify(this.state.years, null, ' ') : ''}
    //     </pre>
    //     Entity: {this.props.entity.get('title')}<br />
    //     Root references:<br />
    //     {references.map((reference, referenceIndex) =>
    //       <div key={referenceIndex}>
    //         Root: {reference.data.title}
    //         {reference.children.map((child, childIndex) =>
    //           <div key={childIndex}>&nbsp;&nbsp; - Child: {child.connectedDocumentTitle}</div>
    //         )}
    //       </div>
    //     )}

    //   </div>
    // );
  }
}

TimelineViewer.propTypes = {
  entity: PropTypes.object,
  references: PropTypes.object,
  templates: PropTypes.object
};

function mapStateToProps(state) {
  // console.log('STATE:', state);
  const {entityView, templates} = state;
  return {entity: entityView.entity, references: entityView.references, templates};
}

export default connect(mapStateToProps)(TimelineViewer);
