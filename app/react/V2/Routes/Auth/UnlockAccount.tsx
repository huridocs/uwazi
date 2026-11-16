import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { apiClient } from '#V2/api/client.js';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { AuthLayout } from './AuthLayout.js';

const QUIET = { policies: { auth: false, notification: false } };

const isOutage = (error: ApiError) =>
  error.kind === 'network' || error.kind === 'timeout' || error.status >= 500;

const revealUnlock = async (
  credentials: { username: string; code: string },
  navigate: ReturnType<typeof useNavigate>,
  report: { setFailed: (failed: boolean) => void; isActive: () => boolean }
) => {
  const [, error] = await apiClient.postJson('unlockaccount', credentials, QUIET);
  if (!report.isActive()) return;
  if (error && isOutage(error)) {
    report.setFailed(true);
    return;
  }
  const notice = error ? 'unlock-invalid' : 'unlocked';
  void navigate(`/login?notice=${notice}`, { replace: true });
};

const UnlockAccount = () => {
  const { username = '', code = '' } = useParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void revealUnlock({ username, code }, navigate, { setFailed, isActive: () => active });
    return () => {
      active = false;
    };
  }, [username, code, navigate]);

  return (
    <AuthLayout component="UnlockAccountView">
      <div
        role="status"
        className="flex flex-col items-center gap-3 py-10 text-sm text-ink-secondary"
      >
        {failed ? (
          <Translate>Could not reach server. Please try again later.</Translate>
        ) : (
          <Translate>Verifying…</Translate>
        )}
      </div>
    </AuthLayout>
  );
};

export { UnlockAccount };
