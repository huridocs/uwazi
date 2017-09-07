import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import Loader from 'app/components/Elements/Loader';
import {t as translate, I18NLink} from 'app/I18N';
import ShowIf from 'app/App/ShowIf';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';
import formater from 'app/Metadata/helpers/formater';

import moment from 'moment';

import {caseTemplate, matterTemplate, renderableTemplates} from '../utils/timelineFixedData';

const desiredTemplates = Object.keys(renderableTemplates).map(t => renderableTemplates[t]);

export class TimelineViewer extends Component {

  getTemplateType(itemTemplate) {
    return this.plainTemplates.reduce((result, template, index) => {
      if (template._id === itemTemplate) {
        return 'timeline-item-type-' + index;
      }
      return result;
    }, '');
  }

  fetchReferences(entityId) {
    return ReferencesAPI.get(entityId);
  }

  getRelatedReferences(references, template) {
    let promise = Promise.resolve([]);
    let relatedEntity = references.find(r => r.connectedDocumentTemplate === template);
    if (relatedEntity) {
      promise = this.fetchReferences(relatedEntity.connectedDocument);
    }

    return promise;
  }

  filterUsefulReferences(entity, references, relatedReferences, isCase) {
    const referenceLabel = this.plainTemplates.find(t => t._id === entity.template).name;
    const referenceClassName = this.getTemplateType(entity.template);
    const relatedReferenceLabel = this.plainTemplates.find(t => t._id === (isCase ? matterTemplate : caseTemplate)).name;
    const relatedReferenceClassName = this.getTemplateType(isCase ? matterTemplate : caseTemplate);

    return references
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
  }

  fetchReferenceData(references) {
    const fetchPromises = references.map(reference => {
      const get = reference.connectedDocumentType === 'document' ? DocumentsAPI.get : EntitiesAPI.get;
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
    reference.timestamp = reference.data.metadata.fecha;
  }

  getDates(entity, origin) {
    const caseDatesNames = this.props.templates.reduce((names, t) => {
      t.get('properties').forEach(p => {
        if (p.get('type') === 'multidate' || p.get('type') === 'date') {
          names.push(p.get('name'));
        }
      });
      return names;
    }, []);

    return entity.metadata.reduce((dates, metadata) => {
      if (caseDatesNames.indexOf(metadata.name) !== -1) {
        if (metadata.type === 'date') {
          dates.push({label: metadata.label, timestamp: metadata.timestamp, origin});
        }

        if (metadata.type === 'multidate') {
          metadata.value.forEach(date => {
            dates.push({label: metadata.label, timestamp: date.timestamp, origin});
          });
        }
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
    const currentYear = Number(moment().format('YYYY'));
    const {minYear, maxYear} = Object.keys(years).reduce((memo, year) => {
      memo.minYear = Math.min(memo.minYear, Number(year));
      memo.maxYear = Math.max(memo.maxYear, Number(year));
      return memo;
    }, {minYear: currentYear, maxYear: 0});

    for (let year = minYear - 3; year < (maxYear || currentYear) + 3; year += 1) {
      years[year] = years[year] || [];
    }

    return years;
  }

  splitByOrigin(years) {
    return ['main', 'related'].reduce((tracks, trackName) => {
      tracks[trackName] = Object.keys(years).reduce((memo, year) => {
        memo.years[year] = years[year].filter(i => trackName === 'main' ? i.origin !== 'related' : i.origin === 'related');
        return memo;
      }, {years: {}, label: '', className: ''});
      return tracks;
    }, {main: {}, related: {}});
  }

  assignActiveYears(tracks) {
    Object.keys(tracks).forEach(track => {
      tracks[track].active = Object.keys(tracks[track].years).reduce((memo, year) => {
        if (tracks[track].years[year].length) {
          if (!memo.start) {
            memo.start = year;
          }
          memo.end = year;
        }
        return memo;
      }, {start: null, end: null});
    });

    return tracks;
  }

  sortEvents(years) {
    Object.keys(years).reduce((memo, year) => {
      years[year].sort((a, b) => Number(a.timestamp) > Number(b.timestamp));
      if (!memo && years[year].length) {
        years[year][0].firstMilestone = true;
        return true;
      }
      return memo;
    }, null);

    return years;
  }

  arrangeTracks(references, dates, hasRelatedReferences) {
    let years = {};
    references.forEach(reference => {
      const isDesiredTemplate = desiredTemplates.indexOf(reference.data.template !== -1);
      const hasDate = reference.data.metadata.fecha !== null;
      if (isDesiredTemplate && hasDate) {
        this.assignDataToYear(years, reference.data.metadata.fecha, reference);
        this.assignAdditionalData(reference);
      }
    });

    dates.forEach(date => {
      this.assignDataToYear(years, date.timestamp, date);
    });

    const tracks = this.assignActiveYears(this.splitByOrigin(this.normalizeYears(this.sortEvents(years))));

    if (!hasRelatedReferences) {
      delete tracks.related;
    }

    return tracks;
  }

  assignTrackLabels(tracks, isMainMatter) {
    const mainTrackTemplate = this.plainTemplates.find(template => template._id === (!isMainMatter ? caseTemplate : matterTemplate));
    tracks.main.label = translate(mainTrackTemplate._id, mainTrackTemplate.name);
    tracks.main.className = this.getTemplateType(mainTrackTemplate._id);
    if (tracks.related) {
      const relatedTrackTemplate = this.plainTemplates.find(template => template._id === matterTemplate);
      tracks.related.label = translate(relatedTrackTemplate._id, relatedTrackTemplate.name);
      tracks.related.className = this.getTemplateType(relatedTrackTemplate._id);
    }
    return tracks;
  }

  getRelatedEntity(references, isCase) {
    let fetchRelatedEntity = Promise.resolve(null);

    const relatedEntity = references.find(r => r.connectedDocumentTemplate === (isCase ? matterTemplate : caseTemplate));
    if (relatedEntity) {
      fetchRelatedEntity = EntitiesAPI.get(relatedEntity.connectedDocument)
                           .then(results => formater.prepareMetadata(results[0], this.props.templates, this.props.thesauris));
    }

    return fetchRelatedEntity;
  }

  getTimelineInfo(entity) {
    let usefulReferences;
    const isCase = entity.template === caseTemplate;

    this.plainTemplates = this.props.templates.toJS();
    this.plainThesauris = this.props.thesauris.toJS();

    this.fetchReferences(entity.sharedId)
    .then(references => {
      const relatedReferences = this.getRelatedReferences(references, isCase ? matterTemplate : caseTemplate);
      return Promise.all([this.getRelatedEntity(references, isCase), references, relatedReferences]);
    })
    .then(([relatedEntity, references, relatedReferences]) => {
      usefulReferences = this.filterUsefulReferences(entity, references, relatedReferences, isCase);
      return Promise.all([relatedEntity, this.fetchReferenceData(usefulReferences), relatedReferences]);
    })
    .then(([relatedEntity, referencesData, relatedReferences]) => {
      const conformedReferences = usefulReferences.map((reference, index) => {
        const {parentTemplate, origin} = reference;
        return {reference, parentTemplate, origin, data: referencesData[index][0]};
      });

      let entityDatesTrack = isCase ? 'main' : 'related';
      entityDatesTrack = !isCase && !relatedEntity ? 'main' : entityDatesTrack;

      const entityDates = this.getDates(entity, entityDatesTrack);
      const relatedDates = relatedEntity ? this.getDates(relatedEntity, isCase ? 'related' : 'main') : [];
      const dates = entityDates.concat(relatedDates);

      const isMainMatter = !isCase && !relatedEntity;

      this.setState({
        references: conformedReferences,
        tracks: this.assignTrackLabels(this.arrangeTracks(conformedReferences, dates, relatedReferences.length), isMainMatter)
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
                    <I18NLink to={`/${reference.reference.connectedDocumentType}/${reference.data.sharedId}`}
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
                    </I18NLink>
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
  templates: PropTypes.object,
  thesauris: PropTypes.object
};

function mapStateToProps({templates, thesauris}) {
  return {templates, thesauris};
}

export default connect(mapStateToProps)(TimelineViewer);
