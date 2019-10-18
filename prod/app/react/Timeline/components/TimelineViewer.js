"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.TimelineViewer = void 0;var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _reactRedux = require("react-redux");

var _Loader = _interopRequireDefault(require("../../components/Elements/Loader"));
var _I18N = require("../../I18N");
var _ShowIf = _interopRequireDefault(require("../../App/ShowIf"));

var _DocumentsAPI = _interopRequireDefault(require("../../Documents/DocumentsAPI"));
var _EntitiesAPI = _interopRequireDefault(require("../../Entities/EntitiesAPI"));
var _referencesAPI = _interopRequireDefault(require("../../Viewer/referencesAPI"));
var _formater = _interopRequireDefault(require("../../Metadata/helpers/formater"));
var _RequestParams = require("../../utils/RequestParams");

var _UI = require("../../UI");

var _moment = _interopRequireDefault(require("moment"));

var _timelineFixedData = require("../utils/timelineFixedData");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

const desiredTemplates = Object.keys(_timelineFixedData.renderableTemplates).map(t => _timelineFixedData.renderableTemplates[t]);
const dateProperties = Object.keys(_timelineFixedData.renderableTemplates).reduce((memo, t) =>
Object.assign(memo, { [_timelineFixedData.renderableTemplates[t]]: _timelineFixedData.datePropertyOverrides[t] || 'fecha' }),
{});

const fetchReferences = entityId => _referencesAPI.default.get(new _RequestParams.RequestParams({ sharedId: entityId }));

const getRelatedReferences = (references, template) => {
  let promise = Promise.resolve([]);
  const relatedEntity = references.find(r => r.entityData.template === template);
  if (relatedEntity) {
    promise = fetchReferences(relatedEntity.entityData.sharedId);
  }

  return promise;
};

const fetchReferenceData = references => {
  const fetchPromises = references.map(reference => {
    const get = reference.entityData.type === 'document' ? _DocumentsAPI.default.get : _EntitiesAPI.default.get;
    return get(new _RequestParams.RequestParams({ sharedId: reference.entityData.sharedId }));
  });

  return Promise.all(fetchPromises);
};

const assignDataToYear = (years, date, data) => {
  const year = _moment.default.utc(date * 1000).format('YYYY');
  years[year] = years[year] || [];
  years[year].push(data);
};

const normalizeYears = years => {
  const currentYear = Number((0, _moment.default)().format('YYYY'));
  const { minYear, maxYear } = Object.keys(years).reduce((memo, year) => {
    memo.minYear = Math.min(memo.minYear, Number(year));
    memo.maxYear = Math.max(memo.maxYear, Number(year));
    return memo;
  }, { minYear: currentYear, maxYear: 0 });

  for (let year = minYear - 3; year < (maxYear || currentYear) + 3; year += 1) {
    years[year] = years[year] || [];
  }

  return years;
};

const splitByOrigin = years => ['main', 'related'].reduce((tracks, trackName) => {
  tracks[trackName] = Object.keys(years).reduce((memo, year) => {
    memo.years[year] = years[year].filter(i => trackName === 'main' ? i.origin !== 'related' : i.origin === 'related');
    return memo;
  }, { years: {}, label: '', className: '' });
  return tracks;
}, { main: {}, related: {} });

class TimelineViewer extends _react.Component {
  getTemplateType(itemTemplate) {
    return this.plainTemplates.reduce((result, template, index) => {
      if (template._id === itemTemplate) {
        return `timeline-item-type-${index}`;
      }
      return result;
    }, '');
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
          dates.push({ label: metadata.label, timestamp: metadata.timestamp, origin });
        }

        if (metadata.type === 'multidate') {
          metadata.value.forEach(date => {
            dates.push({ label: metadata.label, timestamp: date.timestamp, origin });
          });
        }
      }
      return dates;
    }, []);
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
      }, { start: null, end: null });
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
    const years = {};
    references.forEach(reference => {
      const isDesiredTemplate = desiredTemplates.indexOf(reference.data.template !== -1);
      const hasDate = reference.data.metadata[dateProperties[reference.data.template]] !== null;
      if (isDesiredTemplate && hasDate) {
        assignDataToYear(years, reference.data.metadata[dateProperties[reference.data.template]], reference);
        this.assignAdditionalData(reference);
      }
    });

    dates.forEach(date => {
      assignDataToYear(years, date.timestamp, date);
    });

    const tracks = this.assignActiveYears(splitByOrigin(normalizeYears(this.sortEvents(years))));

    if (!hasRelatedReferences) {
      delete tracks.related;
    }

    return tracks;
  }

  assignTrackLabels(tracks, isMainMatter) {
    const mainTrackTemplate = this.plainTemplates.find(template => template._id === (!isMainMatter ? _timelineFixedData.caseTemplate : _timelineFixedData.matterTemplate));
    tracks.main.label = (0, _I18N.t)(mainTrackTemplate._id, mainTrackTemplate.name);
    tracks.main.className = this.getTemplateType(mainTrackTemplate._id);
    if (tracks.related) {
      const relatedTrackTemplate = this.plainTemplates.find(template => template._id === _timelineFixedData.matterTemplate);
      tracks.related.label = (0, _I18N.t)(relatedTrackTemplate._id, relatedTrackTemplate.name);
      tracks.related.className = this.getTemplateType(relatedTrackTemplate._id);
    }
    return tracks;
  }

  getRelatedEntity(references, isCase) {
    let fetchRelatedEntity = Promise.resolve(null);

    const relatedEntity = references.find(r => r.entityData.template === (isCase ? _timelineFixedData.matterTemplate : _timelineFixedData.caseTemplate));
    if (relatedEntity) {
      fetchRelatedEntity = _EntitiesAPI.default.get(new _RequestParams.RequestParams({ sharedId: relatedEntity.entityData.sharedId })).
      then(results => _formater.default.prepareMetadata(results[0], this.props.templates, this.props.thesauris));
    }

    return fetchRelatedEntity;
  }

  getTimelineInfo(entity) {
    let usefulReferences;
    const isCase = entity.template === _timelineFixedData.caseTemplate;

    this.plainTemplates = this.props.templates.toJS();
    this.plainThesauris = this.props.thesauris.toJS();

    fetchReferences(entity.sharedId).
    then(references => {
      const relatedReferences = getRelatedReferences(references, isCase ? _timelineFixedData.matterTemplate : _timelineFixedData.caseTemplate);
      return Promise.all([this.getRelatedEntity(references, isCase), references, relatedReferences]);
    }).
    then(([relatedEntity, references, relatedReferences]) => {
      usefulReferences = this.filterUsefulReferences(entity, references, relatedReferences, isCase);
      return Promise.all([relatedEntity, fetchReferenceData(usefulReferences), relatedReferences]);
    }).
    then(([relatedEntity, referencesData, relatedReferences]) => {
      const conformedReferences = usefulReferences.map((reference, index) => {
        const { parentTemplate, origin } = reference;
        return { reference, parentTemplate, origin, data: referencesData[index][0] };
      });

      let entityDatesTrack = isCase ? 'main' : 'related';
      entityDatesTrack = !isCase && !relatedEntity ? 'main' : entityDatesTrack;

      const entityDates = this.getDates(entity, entityDatesTrack);
      const relatedDates = relatedEntity ? this.getDates(relatedEntity, isCase ? 'related' : 'main') : [];
      const dates = entityDates.concat(relatedDates);

      const isMainMatter = !isCase && !relatedEntity;

      this.setState({
        references: conformedReferences,
        tracks: this.assignTrackLabels(this.arrangeTracks(conformedReferences, dates, relatedReferences.length), isMainMatter) });

    });
  }

  assignAdditionalData(reference) {
    Object.keys(_timelineFixedData.renderableTemplates).forEach(templateName => {
      if (reference.data.template === _timelineFixedData.renderableTemplates[templateName]) {
        reference.additionalData = { type: templateName };
      }
    });

    reference.additionalData.className = this.getTemplateType(reference.data.template);
    reference.additionalData.date = reference.data.metadata[dateProperties[reference.data.template]];
    reference.timestamp = reference.data.metadata[dateProperties[reference.data.template]];
  }

  filterUsefulReferences(entity, references, relatedReferences, isCase) {
    const referenceLabel = this.plainTemplates.find(t => t._id === entity.template).name;
    const referenceClassName = this.getTemplateType(entity.template);
    const relatedReferenceLabel = this.plainTemplates.find(t => t._id === (isCase ? _timelineFixedData.matterTemplate : _timelineFixedData.caseTemplate)).name;
    const relatedReferenceClassName = this.getTemplateType(isCase ? _timelineFixedData.matterTemplate : _timelineFixedData.caseTemplate);

    return references.
    map(r => {
      r.parentTemplate = { label: referenceLabel, className: referenceClassName };
      r.origin = isCase || !relatedReferences.length ? 'main' : 'related';
      return r;
    }).
    concat(relatedReferences.map(r => {
      r.parentTemplate = { label: relatedReferenceLabel, className: relatedReferenceClassName };
      r.origin = isCase ? 'related' : 'main';
      return r;
    })).
    filter(r => desiredTemplates.indexOf(r.entityData.template) !== -1);
  }

  componentDidMount() {
    this.getTimelineInfo(this.props.entity);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity._id !== nextProps.entity._id) {
      this.setState({ tracks: null }, () => {
        this.getTimelineInfo(nextProps.entity);
      });
    }
  }

  render() {
    const tracks = { keys: ['main'], main: '', related: '', axis: '' };
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
            _jsx("div", { className: `timeline-year ${nth5} ${active}` }, year,
            _jsx(_ShowIf.default, { if: year === track.active.start }, void 0,
            _jsx("span", { className: `timeline-track-label item-type__name ${track.className}` }, void 0, track.label)),


            track.years[year].map((reference, index) => {
              if (reference.reference) {
                const linkType = reference.reference.entityData.file ? 'document' : 'entity';
                return (
                  _jsx(_I18N.I18NLink, {
                    to: `/${linkType}/${reference.data.sharedId}`,

                    className: `timeline-item ${reference.additionalData.className}`,
                    "data-toggle": "tooltip",
                    "data-placement": "top",
                    "data-animation": "false",
                    title: `${_moment.default.utc(reference.additionalData.date * 1000).format('ll')}\n${reference.data.title}` }, index,

                  _jsx(_ShowIf.default, { if: reference.firstMilestone }, void 0,
                  _jsx("span", { className: "timeline-milestone " }, void 0,
                  _jsx("span", {}, void 0, `${_moment.default.utc(reference.additionalData.date * 1000).format('MMM YYYY')}`))),


                  _jsx(_ShowIf.default, { if: reference.additionalData.type === 'judgement' }, void 0,
                  _jsx(_UI.Icon, { icon: "gavel" }))));



              }

              if (!reference.reference) {
                return (
                  _jsx("span", {

                    className: "timeline-item",
                    "data-toggle": "tooltip",
                    "data-placement": "top",
                    "data-animation": "false",
                    title: `${_moment.default.utc(reference.timestamp * 1000).format('ll')}\n${reference.label}` }, index,

                  _jsx(_ShowIf.default, { if: reference.firstMilestone }, void 0,
                  _jsx("span", { className: "timeline-milestone " }, void 0,
                  _jsx("span", {}, void 0, `${_moment.default.utc(reference.timestamp * 1000).format('MMM YYYY')}`)))));




              }
            })));


        });
      });

      tracks.axis = Object.keys(this.state.tracks.main.years).map((year) =>
      _jsx("div", { className: "timeline-year" }, year,
      _jsx("div", { className: `timeline-label ${year % 5 === 0 ? 'timeline-label-text' : ''}` }, void 0,
      _jsx("span", {}, void 0, year))));




    }

    return (
      _jsx("div", { className: "timeline" }, void 0,
      (() => {
        if (!this.state || !this.state.tracks) {
          return _jsx(_Loader.default, {});
        }

        return null;
      })(),
      _jsx(_ShowIf.default, { if: Boolean(this.state && this.state.tracks && this.state.tracks.related) }, void 0,
      _jsx("div", { className: "timeline-track" }, void 0,
      tracks.related)),


      _jsx("div", { className: "timeline-track" }, void 0,
      tracks.main),

      _jsx("div", { className: "timeline-track" }, void 0,
      tracks.axis)));



  }}exports.TimelineViewer = TimelineViewer;









function mapStateToProps({ templates, thesauris }, { entity }) {
  return {
    templates,
    thesauris,
    entity: _formater.default.prepareMetadata(entity, templates, thesauris) };

}var _default =

(0, _reactRedux.connect)(mapStateToProps)(TimelineViewer);exports.default = _default;