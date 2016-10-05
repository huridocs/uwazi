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
      <div className="timeline">
          <div className="timeline-track">
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year timeline-year-active">
                  <span className="timeline-track-label item-type__name">Medidas provisionales</span>
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Sep 22, 1995 Blake. Resolución de la CorteIDH de 22 de septiembre de 1995" href="/document/11577e4ed9d14cf21daaeea264b4e974">

                  </a>
                  <a className="timeline-item timeline-item-type-6" data-toggle="tooltip" data-placement="top" data-animation="false" title="Aug 16, 1995 Blake. Resolución del Presidente de 16 de agosto de 1995" href="/document/11577e4ed9d14cf21daaeea264b59b85">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active"></div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Apr 18, 1997 Blake. Resolución de la CorteIDH de 18 de abril de 1997" href="/document/11577e4ed9d14cf21daaeea264b53f07">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active"></div>
              <div className="timeline-year timeline-year-active"></div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Aug 18, 2000 Blake. Resolución de la CorteIDH de 18 de agosto de 2000" href="/document/11577e4ed9d14cf21daaeea264b631b6">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jun 2, 2001 Blake. Resolución de la CorteIDH de 2 de junio de 2001" href="/document/11577e4ed9d14cf21daaeea264b6c255">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active"></div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jun 6, 2003 Blake. Resolución de la CorteIDH de 6 de junio de 2003" href="/document/11577e4ed9d14cf21daaeea264b5b74e">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 17, 2004 Blake. Resolución de la CorteIDH de 17 de noviembre de 2004" href="/document/11577e4ed9d14cf21daaeea264b66809">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jun 14, 2005 Blake. Resolución de la CorteIDH de 14 de junio de 2005" href="/document/11577e4ed9d14cf21daaeea264b5fa51">

                  </a>
              </div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
              <div className="timeline-year"></div>
          </div>
          <div className="timeline-track">
              <div className="timeline-year">

              </div>
              <div className="timeline-year">

              </div>
              <div className="timeline-year">

              </div>
              <div className="timeline-year timeline-year-active">
                  <span className="timeline-track-label item-type__name">Causa</span>
                  <span className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 18, 1993 Presentación ante la comisión">
                    <span className="timeline-milestone "><span>Mar 1993</span></span>
                  </span></div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">
                  <span className="timeline-item" data-toggle="tooltip" data-placement="top" data-animation="false" title="Aug 5, 1995 Presentación ante la corte"></span></div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-2" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jul 2, 1996 Blake. Excepciones Preliminares. Sentencia de 2 de julio de 1996" href="/document/11577e4ed9d14cf21daaeea264b89f3a"><i className="fa fa-legal"></i></a></div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-2" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jan 24, 1998 Blake. Fondo. Sentencia de 24 de enero de 1998" href="/document/11577e4ed9d14cf21daaeea264b83fee"><i className="fa fa-legal"></i></a></div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-2" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jan 22, 1999 Blake. Reparaciones y Costas. Sentencia de 22 de enero de 1999" href="/document/11577e4ed9d14cf21daaeea264b8fa89"><i className="fa fa-legal"></i></a><a className="timeline-item timeline-item-type-2" data-toggle="tooltip" data-placement="top" data-animation="false"
                      title="Oct 1, 1999 Blake. Interpretación. Sentencia de 1 de octubre de 1999" href="/document/11577e4ed9d14cf21daaeea264b9727c"><i className="fa fa-legal"></i></a></div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 27, 2002 Blake. Resolución de la CorteIDH de 27 de noviembre de 2002" href="/document/11577e4ed9d14cf21daaeea264b748c3">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">

                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 27, 2003 Blake. Resolución de la CorteIDH de 27 de noviembre de 2003" href="/document/11577e4ed9d14cf21daaeea264b800a4">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 27, 2007 Blake. Resolución de la CorteIDH de 27 de noviembre de 2007" href="/document/11577e4ed9d14cf21daaeea264b7b3a9">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Jan 22, 2009 Blake. Resolución de la CorteIDH de 22 de enero de 2009" href="/document/11577e4ed9d14cf21daaeea264b7026b">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

              </div>
              <div className="timeline-year timeline-year-active">

                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Aug 21, 2014 Blake [y otros casos]. Resolución de la CorteIDH de 21 de agosto de 2014" href="/document/11577e4ed9d14cf21daaeea264b9de69">

                  </a>
              </div>
              <div className="timeline-year timeline-year-active">
                  <a className="timeline-item timeline-item-type-9" data-toggle="tooltip" data-placement="top" data-animation="false" title="Nov 24, 2015 Blake [y otros casos]. Resolución de la CorteIDH de 24 de noviembre de 2015" href="/document/11577e4ed9d14cf21daaeea264ba1e56">

                  </a>
              </div>
              <div className="timeline-year">

              </div>
              <div className="timeline-year">

              </div>
              <div className="timeline-year">

              </div>
          </div>
          <div className="timeline-track">
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>1990</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1991</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1992</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1993</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1994</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>1995</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1996</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1997</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1998</span></div>
                </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>1999</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>2000</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2001</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2002</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2003</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2004</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>2005</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2006</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2007</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2008</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2009</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>2010</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2011</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2012</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2013</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2014</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label timeline-label-text"><span>2015</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2016</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2017</span></div>
              </div>
              <div className="timeline-year">
                  <div className="timeline-label "><span>2018</span></div>
              </div>
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
