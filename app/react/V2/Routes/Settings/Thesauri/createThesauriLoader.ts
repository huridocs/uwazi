import { IncomingHttpHeaders } from 'http';
import { LoaderFunction } from 'react-router';
import { services, type V2Services } from '#V2/services/index.js';

/**
 * Injectable loader factory for the Thesauri list route.
 * Production wiring migrates in Phase 1a; tests use this factory today.
 */
const createThesauriLoader =
  (svc: V2Services = services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [data, error] = await svc.thesauri.getAll({ headers });
    if (error) throw error;
    return data;
  };

export { createThesauriLoader };
