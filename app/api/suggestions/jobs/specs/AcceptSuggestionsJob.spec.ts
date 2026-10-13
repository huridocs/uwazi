import { AcceptSuggestionsJob } from '../AcceptSuggestionsJob.js';
import { isPrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

describe('AcceptSuggestionsJob', () => {
  it('is a privileged job, so its recompute bypasses entity RLS', () => {
    expect(isPrivilegedJob(AcceptSuggestionsJob as unknown as { name: string })).toBe(true);
  });
});
