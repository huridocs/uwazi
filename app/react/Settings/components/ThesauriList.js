import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';
import { withContext, withRouter } from 'app/componentWrappers';
import RouteHandler from 'app/App/RouteHandler';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { I18NLink, t, Translate } from 'app/I18N';
import { checkThesaurusCanBeDeleted, deleteThesaurus } from 'app/Thesauri/actions/thesaurisActions';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';
import { SettingsHeader } from './SettingsHeader';
import sortThesauri from '../utils/sortThesauri';
import { shouldDisplayTranslation } from '../utils/shouldDisplayTranslation';

class ThesauriList extends RouteHandler {
  static async requestState(requestParams) {
    const thesauri = await ThesauriAPI.getThesauri(requestParams);
    return [actions.set('dictionaries', thesauri)];
  }

  getThesaurusSuggestionActions(thesaurus) {
    const showSuggestions =
      this.props.topicClassificationEnabled || thesaurus.enable_classification;
    return (
      showSuggestions && (
        <div className="vertical-line">
          {thesaurus.enable_classification && (
            <span className="thesaurus-suggestion-count">
              {thesaurus.suggestions ? thesaurus.suggestions.toLocaleString() : 'No'}&nbsp;
              {t('System', 'documents to be reviewed')}
            </span>
          )}
          <I18NLink
            to={`/settings/dictionaries/cockpit/${thesaurus._id}`}
            className="btn btn-default btn-xs"
          >
            <span>{t('System', 'Configure suggestions')}</span>
          </I18NLink>
        </div>
      )
    );
  }

  getThesaurusModifyActions(thesaurus) {
    return (
      <div>
        <I18NLink
          to={`/settings/dictionaries/edit/${thesaurus._id}`}
          className="btn btn-default btn-xs"
          confirmTitle={
            thesaurus.enable_classification ? 'Confirm edit suggestion-enabled Thesaurus' : ''
          }
          confirmMessage={
            thesaurus.enable_classification
              ? 'Uwazi suggests labels based on the current content of the document collection and its metadata. ' +
                'Editing this thesaurus, the content of the documents or other metadata can affect Uwazi’s understanding of what to suggest.'
              : ''
          }
        >
          <Icon icon="pencil-alt" />
          &nbsp;
          <span>{t('System', 'Edit')}</span>
        </I18NLink>
        {'  '}
        <button
          onClick={this.deleteThesaurus.bind(this, thesaurus)}
          className="btn btn-danger btn-xs template-remove"
          type="button"
        >
          <Icon icon="trash-alt" />
          &nbsp;
          <span>{t('System', 'Delete')}</span>
        </button>
      </div>
    );
  }

  deleteThesaurus(thesaurus) {
    return this.props
      .checkThesaurusCanBeDeleted(thesaurus)
      .then(() => {
        this.props.mainContext.confirm({
          accept: () => {
            this.props.deleteThesaurus(thesaurus);
          },
          title: (
            <>
              <Translate>Confirm deletion of thesaurus:</Translate>&nbsp;{thesaurus.name}
            </>
          ),
          message: 'Are you sure you want to delete this thesaurus?',
        });
      })
      .catch(() => {
        this.props.mainContext.confirm({
          accept: () => {},
          noCancel: true,
          title: (
            <>
              <Translate>Cannot delete thesaurus:&nbsp;</Translate>&nbsp;{thesaurus.name}
            </>
          ),
          message: 'This thesaurus is being used in document types and cannot be deleted.',
        });
      });
  }

  thesaurusNode(thesaurus) {
    return (
      <tr key={thesaurus.name}>
        <th scope="row">
          <Link to={`/settings/dictionaries/edit/${thesaurus._id}`}>{thesaurus.name}</Link>
          {shouldDisplayTranslation(
            thesaurus.name,
            thesaurus._id,
            this.props.locale,
            this.props.languages
          ) && (
            <>
              &nbsp;&#40;<Translate context={thesaurus._id}>{thesaurus.name}</Translate>&#41;
            </>
          )}
        </th>
        <td>{this.getThesaurusSuggestionActions(thesaurus)}</td>
        <td>{this.getThesaurusModifyActions(thesaurus)}</td>
      </tr>
    );
  }

  render() {
    return (
      <div className="settings-content">
        <div className="flex panel panel-default">
          <SettingsHeader>
            <Translate>Thesauri</Translate>
          </SettingsHeader>
          <div className="thesauri-list">
            <table>
              <thead>
                <tr>
                  <th className="nameCol" scope="col" />
                  <th scope="col" />
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {sortThesauri(this.props.dictionaries.toJS()).map(thesaurus =>
                  this.thesaurusNode(thesaurus)
                )}
              </tbody>
            </table>
          </div>
          <div className="settings-footer">
            <I18NLink to="/settings/dictionaries/new" className="btn btn-default">
              <Icon icon="plus" />
              <span className="btn-label">{t('System', 'Add thesaurus')}</span>
            </I18NLink>
          </div>
        </div>
      </div>
    );
  }
}

ThesauriList.propTypes = {
  dictionaries: PropTypes.object,
  topicClassificationEnabled: PropTypes.bool,
  locale: PropTypes.string.isRequired,
  languages: PropTypes.object.isRequired,
  deleteThesaurus: PropTypes.func.isRequired,
  checkThesaurusCanBeDeleted: PropTypes.func.isRequired,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    dictionaries: state.dictionaries,
    topicClassificationEnabled: (state.settings.collection.toJS().features || {})
      .topicClassification,
    locale: state.locale,
    languages: state.settings.collection.get('languages'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      deleteThesaurus,
      checkThesaurusCanBeDeleted,
    },
    dispatch
  );
}

export { ThesauriList, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(withContext(ThesauriList)));
