import React, { FormEvent, useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import api from 'app/utils/api';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { PreserveIcon } from 'app/Layout/PreserveIcon';
import { SettingsHeader } from './SettingsHeader';
import './styles/preserve.scss';

function mapStateToProps({ settings, user }: IStore) {
  return {
    settings: settings.collection,
    user,
  };
}

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const PreserveSettingsComp = ({ settings, user }: mappedProps) => {
  const [token, setToken] = useState('');
  const requestToken = async (e: FormEvent) => {
    e.preventDefault();
    const result = await api.post('preserve');
    setToken(result.json.token);
  };

  useEffect(() => {
    const preserve = settings.get('features')?.get('preserve');
    const userConfigs = preserve
      ?.get('config')
      ?.find(conf => conf?.get('user')?.toString() === user.get('_id')?.toString());

    if (userConfigs) {
      const savedToken = userConfigs.get('token');
      setToken(savedToken);
    }
  }, []);

  return (
    <div className="settings-content">
      <div className="panel panel-preserve panel-default">
        <SettingsHeader>
          <div className="panel-preserve-heading">
            <PreserveIcon color="#D20D6C" /> <Translate>Preserve Extension</Translate>
          </div>
        </SettingsHeader>
        <div className="panel-preserve-content">
          <div className="status">
            <Translate>You have not connected an Uwazi instance, yet</Translate>
          </div>
          <div className="setup">
            <div className="span">
              <Translate>INSTALL the browser extension</Translate>
            </div>
            <br />
            <div className="span">
              <Translate translationKey="Preserve Setup Description">
                If you know your Uwazi URL and TOKEN click the link below, and fill the required
                information.
              </Translate>
            </div>
            <div className="install-buttons" style={{ display: 'none' }}>
              <button type="button">
                <Translate>Install browser extension (dynamic link)</Translate>
              </button>
              <div>
                <a
                  href="https://uwazi.io/page/9852italrtk/support"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Translate>Chrome extension store link</Translate>
                </a>
              </div>
              <div>
                <a
                  href="https://uwazi.io/page/9852italrtk/support"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Translate>Firefox extension store link</Translate>
                </a>
              </div>
            </div>
            <hr />
            <div className="preserve-token">
              <div>
                <Translate>Configuration</Translate>
              </div>
              <form onSubmit={requestToken}>
                <div className="form-group">
                  <label className="form-group-label" htmlFor="collection_name">
                    <Translate>Extension Token</Translate>
                  </label>
                  <input value={token} className="form-control" disabled />
                </div>
                {token && (
                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(token);
                    }}
                  >
                    <Translate>Copy token</Translate>
                  </button>
                )}
                {!token && (
                  <button type="submit" className="btn btn-success">
                    <Translate>Request token</Translate>
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const container = connector(PreserveSettingsComp);
export { container as PreserveSettings };
