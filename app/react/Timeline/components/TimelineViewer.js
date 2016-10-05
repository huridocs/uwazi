import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import Loader from 'app/components/Elements/Loader';
import {Link} from 'react-router';
import ShowIf from 'app/App/ShowIf';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';

import moment from 'moment';

// const countryTemplate = 'e8e039070aa95f8f964c281d450d1022';
const caseTemplate = 'cd951f1feec188a75916812d43252418';
const matterTemplate = '6e2bfa14cc35c78b202a63e5c63ec969';

const renderableTemplates = {
  judgement: '5c7180d3dd310766a1c6817c165ed5f4',
  admissibilityReport: 'e8e039070aa95f8f964c281d4583100d',
  orderOfThePresident: 'd0565557e2c6f741bb73738c56868584',
  orderOfTheCourt: 'ea4dab90522f811e06c208ceef46db95'
};

const desiredTemplates = Object.keys(renderableTemplates).map(t => renderableTemplates[t]);

const caseDatesLabels = [
  'Envío a la corte',
  'Presentación ante la comisión',
  'Presentación ante la corte'
];

export class TimelineViewer extends Component {

  getTemplateType(itemTemplate) {
    return this.props.templates.toJS().reduce((result, template, index) => {
      if (template._id === itemTemplate) {
        return 'timeline-item-type-' + index;
      }
      return result;
    }, '');
  }

  fetchReferences(entityId) {
    return ReferencesAPI.get(entityId);
  }

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

  assignAdditionalData(reference) {
    Object.keys(renderableTemplates).forEach(templateName => {
      if (reference.data.template === renderableTemplates[templateName]) {
        reference.additionalData = {type: templateName};
      }
    });

    reference.additionalData.className = this.getTemplateType(reference.data.template);
    reference.additionalData.date = reference.data.metadata.fecha;
  }

  getCaseDates(entity) {
    return entity.metadata.reduce((dates, metadata) => {
      if (caseDatesLabels.indexOf(metadata.label) !== -1) {
        metadata.value.forEach(date => {
          dates.push({label: metadata.label, timestamp: date.timestamp});
        });
      }
      return dates;
    }, []);
  }

  assignDataToYear(years, date, data) {
    const year = moment.utc(date * 1000).format('YYYY');
    years[year] = years[year] || [];
    years[year].push(data);
  }

  normalizeYears(years) {
    const minYear = Object.keys(years).reduce((min, year) => {
      return Math.min(min, Number(year));
    }, Number(moment().format('YYYY')));

    const maxYear = Object.keys(years).reduce((max, year) => {
      return Math.max(max, Number(year));
    }, minYear);

    for (let year = minYear - 3; year < maxYear + 4; year += 1) {
      years[year] = years[year] || [];
    }

    return years;
  }

  splitByOrigin(years) {
    const related = Object.keys(years).reduce((memo, year) => {
      memo[year] = years[year].filter(i => i.origin === 'related');
      return memo;
    }, {});
    const main = Object.keys(years).reduce((memo, year) => {
      memo[year] = years[year].filter(i => i.origin !== 'related');
      return memo;
    }, {});
    return {main, related};
  }

  arrangeYears(references, caseDates, relatedReferencesExist) {
    let years = {};
    references.forEach(reference => {
      const isDesiredTemplate = desiredTemplates.indexOf(reference.data.template !== -1);
      const hasDate = reference.data.metadata.fecha !== null;
      if (isDesiredTemplate && hasDate) {
        this.assignDataToYear(years, reference.data.metadata.fecha, reference);
        this.assignAdditionalData(reference);
      }
    });

    caseDates.forEach(date => {
      this.assignDataToYear(years, date.timestamp, date);
    });

    let normalizedYears = this.normalizeYears(years);
    return relatedReferencesExist ? this.splitByOrigin(normalizedYears) : {main: years};
  }

  getTimelineInfo(entity) {
    let usefulReferences;
    const isCase = entity.template === caseTemplate;
    const isMatter = entity.template === matterTemplate;
    // let relatedEntity;

    this.fetchReferences(entity._id)
    .then(references => {
      let getRelatedReferences = Promise.resolve([]);
      if (isCase) {
        let caseMatter = references.find(r => r.connectedDocumentTemplate === matterTemplate);
        if (caseMatter) {
          getRelatedReferences = this.fetchReferences(caseMatter.connectedDocument);
        }
      }

      if (isMatter) {
        let matterCase = references.find(r => r.connectedDocumentTemplate === caseTemplate);
        if (matterCase) {
          getRelatedReferences = this.fetchReferences(matterCase.connectedDocument);
        }
      }

      return Promise.all([references, getRelatedReferences]);
    })
    .then(([references, relatedReferences]) => {
      usefulReferences = references
                         .map(r => {
                           r.origin = isCase || !relatedReferences.length ? 'main' : 'related';
                           return r;
                         })
                         .concat(relatedReferences.map(r => {
                           r.origin = isCase ? 'related' : 'main';
                           return r;
                         }))
                         .filter(r => desiredTemplates.indexOf(r.connectedDocumentTemplate) !== -1);
      return Promise.all([this.fetchReferenceData(usefulReferences), relatedReferences]);
    })
    .then(([referencesData, relatedReferences]) => {
      const conformedReferences = usefulReferences.map((reference, index) => {
        return {reference, origin: reference.origin, data: referencesData[index][0]};
      });

      this.setState({
        references: conformedReferences,
        years: this.arrangeYears(conformedReferences, this.getCaseDates(entity), Boolean(relatedReferences.length))
      });
    });
  }

  componentDidMount() {
    this.getTimelineInfo(this.props.entity);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity._id !== nextProps.entity._id) {
      this.setState({years: null}, () => {
        this.getTimelineInfo(nextProps.entity);
      });
    }
  }

  render() {
    let years = {main: '', related: ''};
    if (this.state && this.state.years) {
      years.main = Object.keys(this.state.years.main).map(year =>
        <div key={year} className="timeline-year">
          <div className={`timeline-label ${year % 5 === 0 ? 'timeline-label-text' : ''}`}>
            <span>{year}</span>
          </div>
          {this.state.years.main[year].map((reference, index) => {
            if (reference.reference) {
              return (
                <Link to={`/${reference.reference.connectedDocumentType}/${reference.data._id}`}
                      key={index}
                      className={`timeline-item ${reference.additionalData.className}`}
                      data-toggle="tooltip"
                      data-placement="top"
                      data-animation="false"
                      title={`${moment.utc(reference.additionalData.date * 1000).format('ll')}\n${reference.data.title}`}>
                  <ShowIf if={reference.additionalData.type === 'judgement'}>
                    <i className="fa fa-legal"></i>
                  </ShowIf>
                </Link>
              );
            }

            if (!reference.reference) {
              return (
                <span key={index}
                      className="timeline-item"
                      data-toggle="tooltip"
                      data-placement="top"
                      data-animation="false"
                      title={`${moment.utc(reference.timestamp * 1000).format('ll')}\n${reference.label}`}>
                </span>
              );
            }
          })}
        </div>
      );

      if (this.state.years.related) {
        years.related = Object.keys(this.state.years.related).map(year =>
          <div key={year} className="timeline-year">
            {this.state.years.related[year].map((reference, index) => {
              return (
                <Link to={`/${reference.reference.connectedDocumentType}/${reference.data._id}`}
                      key={index}
                      className={`timeline-item ${reference.additionalData.className}`}
                      data-toggle="tooltip"
                      data-placement="top"
                      data-animation="false"
                      title={`${moment.utc(reference.additionalData.date * 1000).format('ll')}\n${reference.data.title}`}>
                  <ShowIf if={reference.additionalData.type === 'judgement'}>
                    <i className="fa fa-legal"></i>
                  </ShowIf>
                </Link>
              );
            })}
          </div>
        );
      }
    }
    return (
      <div>
        <ShowIf if={Boolean(this.state && this.state.years && this.state.years.related)}>
          <div className="timeline">
            {years.related}
          </div>
        </ShowIf>
        <div className="timeline">
          {(() => {
            if (!this.state || !this.state.years) {
              return <Loader/>;
            }
          })()}
          {years.main}
        </div>
      </div>
    );
  }
}

TimelineViewer.propTypes = {
  entity: PropTypes.object,
  references: PropTypes.object,
  templates: PropTypes.object
};

function mapStateToProps({templates}) {
  return {templates};
}

export default connect(mapStateToProps)(TimelineViewer);
