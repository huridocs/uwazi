import React from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import './styles/preserve.scss';

const PreserveSettings = () => (
  <>
    <div className="panel panel-preserve">
      <div className="panel-preserve-heading">
        <Icon icon="square" /> <Translate>Preserve Extension</Translate>
      </div>
      <div className="panel-preserve-content">
        <div className="status">
          <Translate>You haven&apos;t connected an Uwazi instance, yet.</Translate>
        </div>
        <div className="setup">
          <div className="span">
            <strong>Install</strong> the browser extension
          </div>
          <br />
          <div className="span">
            If you know your Uwazi <strong>URL</strong> and <strong>TOKEN</strong>, click the link
            bellow, and fill the required information.
          </div>
          <div className="install-buttons">
            <button>Install browser extension (dynamic link)</button>
            <div>
              <a
                href="https://uwazi.readthedocs.io/en/latest/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chrome extension store link
              </a>
            </div>
            <div>
              <a
                href="https://uwazi.readthedocs.io/en/latest/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Firefox extension store link
              </a>
            </div>
          </div>
          <hr />
          <div className="preserve-token">
            <div>Configuration</div>
            <form onSubmit={() => {}}>
              <div className="form-group">
                <label className="form-group-label" htmlFor="collection_name">
                  <Translate>Extension Token</Translate>
                </label>
                <input onChange={() => {}} className="form-control" />
              </div>
              <button type="submit" className="btn btn-success">
                <Translate>Request token</Translate>
              </button>
            </form>
            <div className="info">Some information about the token</div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export { PreserveSettings };
