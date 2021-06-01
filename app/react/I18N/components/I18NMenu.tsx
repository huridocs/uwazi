import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import React, { Component } from 'react';

import { NeedAuthorization } from 'app/Auth';
import { actions, t } from 'app/I18N';

const defaultProps = {
  locale: null,
  handleClick: () => {},
};

export type I18NMenuProps = typeof defaultProps & {
  languages: any;
  location: any;
  i18nmode: any;
  toggleInlineEdit: any;
};

export type I18NMenuState = {
  i18NMenuVisibility: boolean;
};

class I18NMenu extends Component<I18NMenuProps, I18NMenuState> {
  static reload(url: string) {
    window.location.href = url;
  }

  static defaultProps = defaultProps;

  constructor(props: I18NMenuProps) {
    super(props);

    this.state = { i18NMenuVisibility: false };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ i18NMenuVisibility: true });
  }

  render() {
    const { languages, locale, location, i18nmode, toggleInlineEdit } = this.props;

    let path = location.pathname;
    const regexp = new RegExp(`^/?${locale}/|^/?${locale}$`);
    path = path.replace(regexp, '/');

    const selectedLanguageLabel = languages.map((lang: any) => {
      const key = lang.get('key');
      if (key === locale) {
        const label = lang.get('label');
        return label;
      }
      return '';
    });

    return (
      <div className="translation-menu">
        <NeedAuthorization roles={['admin', 'editor']}>
          <label className="translation-switch">
            <input
              type="checkbox"
              className="translation-switch-input"
              aria-label={t('System', 'Add/edit translations', null, false)}
              onChange={toggleInlineEdit}
              checked={!!i18nmode}
            />
            <span className="translation-switch-slider" />
          </label>
          {/* <button
            className={`menuNav-btn btn btn-default${i18nmode ? ' inlineEdit active' : ''}`}
            type="button"
            onClick={toggleInlineEdit}
            aria-label={t('System', 'Add/edit translations', null, false)}
          >
            <Icon icon="language" size="lg" />
          </button> */}
        </NeedAuthorization>
        <p>
          <svg
            width="16"
            height="14"
            viewBox="0 0 16 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              // eslint-disable-next-line max-len
              d="M6.86134 7.38519L8.59317 9.09656L8.075 10.4841L5.95453 8.36359L2.54543 11.7727L1.58064 10.8079L5.04769 7.38177C4.19544 6.43405 3.5136 5.38403 3.01588 4.27267H4.3795C4.7954 5.08405 5.32041 5.8511 5.9545 6.55678C6.93632 5.46585 7.65565 4.21812 8.11587 2.90222H0.499969V1.54541H5.27269V0.181763H6.63634V1.54541H11.4091V2.91245H9.41135C8.9136 4.52155 8.06816 6.04199 6.88179 7.36473L6.86134 7.38519ZM11.0682 5.63634H12.4318L15.5 13.8182H14.1363L13.3693 11.7727H10.1307L9.36362 13.8182H7.99997L11.0682 5.63634ZM11.75 7.45337L10.642 10.4091H12.858L11.75 7.45337Z"
              fill="white"
            />
          </svg>
          {selectedLanguageLabel}
        </p>
        <ul className="menuNav-I18NMenu" role="navigation" aria-label="Languages">
          {languages.count() > 1 &&
            languages.map((lang: any) => {
              const key = lang.get('key');
              const label = lang.get('label');
              const url = `/${key}${path}${path.match('document') ? '' : location.search}`;
              return (
                <li className={`menuNav-item${locale === key ? ' is-active' : ''}`} key={key}>
                  <a className="menuNav-btn btn btn-default" href={url} aria-label={label}>
                    {label}
                  </a>
                </li>
              );
            })}
        </ul>
      </div>
    );
  }
}

export function mapStateToProps(state: any) {
  return {
    languages: state.settings.collection.get('languages'),
    i18nmode: state.inlineEdit.get('inlineEdit'),
    locale: state.locale,
  };
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators({ toggleInlineEdit: actions.toggleInlineEdit }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(I18NMenu));
