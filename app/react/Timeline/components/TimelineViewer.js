import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import Loader from 'app/components/Elements/Loader';
import {Link} from 'react-router';
import ShowIf from 'app/App/ShowIf';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';

import moment from 'moment';

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

    for (let year = minYear - 3; year < maxYear + 3; year += 1) {
      years[year] = years[year] || [];
    }

    return years;
  }

  splitByOrigin(years) {
    const main = Object.keys(years).reduce((memo, year) => {
      memo.years[year] = years[year].filter(i => i.origin !== 'related');
      if (!memo.label && memo.years[year].length) {
        const refWithParentTemplate = memo.years[year].find(r => r.parentTemplate);
        if (refWithParentTemplate) {
          memo.label = refWithParentTemplate.parentTemplate.label;
          memo.className = refWithParentTemplate.parentTemplate.className;
        }
      }
      return memo;
    }, {years: {}, label: '', className: ''});
    const related = Object.keys(years).reduce((memo, year) => {
      memo.years[year] = years[year].filter(i => i.origin === 'related');
      if (!memo.label && memo.years[year].length) {
        const refWithParentTemplate = memo.years[year].find(r => r.parentTemplate);
        if (refWithParentTemplate) {
          memo.label = refWithParentTemplate.parentTemplate.label;
          memo.className = refWithParentTemplate.parentTemplate.className;
        }
      }
      return memo;
    }, {years: {}, label: '', className: ''});

    return {main, related};
  }

  assignActiveYears(tracks) {
    Object.keys(tracks).forEach(track => {
      tracks[track].active = Object.keys(tracks[track].years).reduce((memo, year) => {
        if (!memo.start && tracks[track].years[year].length) {
          memo.start = year;
        }
        if (tracks[track].years[year].length) {
          memo.end = year;
        }
        return memo;
      }, {start: null, end: null});
    });

    return tracks;
  }

  arrangeTracks(references, caseDates) {
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

    const firstMilestoneRef = Object.keys(years).reduce((memo, year) => {
      let milestone = memo;
      years[year].forEach(ref => {
        if (ref.timestamp) {
          milestone = memo === null || Math.min(memo, ref.timestamp) === ref.timestamp ? ref : milestone;
        }
        if (ref.additionalData && ref.additionalData.date) {
          milestone = memo === null || Math.min(memo, ref.additionalData.date) === ref.additionalData.date ? ref : milestone;
        }
      });
      return milestone;
    }, null);

    if (firstMilestoneRef) {
      firstMilestoneRef.firstMilestone = true;
    }

    let tracks = this.splitByOrigin(this.normalizeYears(years));
    return this.assignActiveYears(tracks);
  }

  getTimelineInfo(entity) {
    let usefulReferences;
    const isCase = entity.template === caseTemplate;
    const isMatter = entity.template === matterTemplate;

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
      const referenceLabel = this.props.templates.toJS().find(t => t._id === entity.template).name;
      const referenceClassName = this.getTemplateType(entity.template);
      const relatedReferenceLabel = this.props.templates.toJS().find(t => t._id === (isCase ? matterTemplate : caseTemplate)).name;
      const relatedReferenceClassName = this.getTemplateType(isCase ? matterTemplate : caseTemplate);

      usefulReferences = references
                         .map(r => {
                           r.parentTemplate = {label: referenceLabel, className: referenceClassName};
                           r.origin = isCase || !relatedReferences.length ? 'main' : 'related';
                           return r;
                         })
                         .concat(relatedReferences.map(r => {
                           r.parentTemplate = {label: relatedReferenceLabel, className: relatedReferenceClassName};
                           r.origin = isCase ? 'related' : 'main';
                           return r;
                         }))
                         .filter(r => desiredTemplates.indexOf(r.connectedDocumentTemplate) !== -1);
      return Promise.all([this.fetchReferenceData(usefulReferences), relatedReferences]);
    })
    .then(([referencesData, relatedReferences]) => {
      const conformedReferences = usefulReferences.map((reference, index) => {
        const {parentTemplate, origin} = reference;
        return {reference, parentTemplate, origin, data: referencesData[index][0]};
      });

      const tracks = this.arrangeTracks(conformedReferences, this.getCaseDates(entity));
      if (!relatedReferences.length) {
        delete tracks.related;
      }

      this.setState({
        references: conformedReferences,
        tracks
      });
    });
  }

  componentDidMount() {
    this.getTimelineInfo(this.props.entity);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity._id !== nextProps.entity._id) {
      this.setState({tracks: null}, () => {
        this.getTimelineInfo(nextProps.entity);
      });
    }
  }

  render() {
    const tracks = {keys: ['main'], main: '', related: '', axis: ''};
    if (this.state && this.state.tracks) {
      if (Object.keys(this.state.tracks).indexOf('related') !== -1) {
        tracks.keys.push('related');
      }

      tracks.keys.forEach(trackName => {
        const track = this.state.tracks[trackName];
        tracks[trackName] = Object.keys(track.years).map(year => {
          const nth5 = year % 5 === 0 ? 'nth5' : '';
          const activeClassName = `timeline-year-active ${track.className.replace('timeline-item-', '')}`;
          const active = year >= track.active.start && year <= track.active.end ? activeClassName : '';
          return (
            <div key={year}
                 className={`timeline-year ${nth5} ${active}`}>
              <ShowIf if={year === track.active.start}>
                <span className={`timeline-track-label item-type__name ${track.className}`}>{track.label}</span>
              </ShowIf>

              {track.years[year].map((reference, index) => {
                if (reference.reference) {
                  return (
                    <Link to={`/${reference.reference.connectedDocumentType}/${reference.data._id}`}
                          key={index}
                          className={`timeline-item ${reference.additionalData.className}`}
                          data-toggle="tooltip"
                          data-placement="top"
                          data-animation="false"
                          title={`${moment.utc(reference.additionalData.date * 1000).format('ll')}\n${reference.data.title}`}>
                      <ShowIf if={reference.firstMilestone}>
                        <span className="timeline-milestone ">
                          <span>{`${moment.utc(reference.additionalData.date * 1000).format('MMM YYYY')}`}</span>
                        </span>
                      </ShowIf>
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
                      <ShowIf if={reference.firstMilestone}>
                        <span className="timeline-milestone ">
                          <span>{`${moment.utc(reference.timestamp * 1000).format('MMM YYYY')}`}</span>
                        </span>
                      </ShowIf>
                    </span>
                  );
                }
              })}
            </div>
          );
        });
      });

      tracks.axis = Object.keys(this.state.tracks.main.years).map(year =>
        <div key={year} className="timeline-year">
          <div className={`timeline-label ${year % 5 === 0 ? 'timeline-label-text' : ''}`}>
            <span>{year}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="timeline">
        {(() => {
          if (!this.state || !this.state.tracks) {
            return <Loader/>;
          }
        })()}
        <ShowIf if={Boolean(this.state && this.state.tracks && this.state.tracks.related)}>
          <div className="timeline-track">
            {tracks.related}
          </div>
        </ShowIf>
        <div className="timeline-track">
          {tracks.main}
        </div>
        <div className="timeline-track">
          {tracks.axis}
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
