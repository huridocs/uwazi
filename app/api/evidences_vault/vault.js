import 'isomorphic-fetch';
import { URLSearchParams } from 'url';
import request from 'shared/JSONRequest';
import { fileFromReadStream } from 'api/files/filesystem';
import evidencePackage from './evidencePackage';

import vaultEvidencesModel from './vaultEvidencesModel';

const vaultUrl = 'https://public.evidence-vault.org/';
const statusToProcess = ['201', '418'];

const vault = {
  async newEvidences(token) {
    const body = new URLSearchParams();
    body.append('token', token);

    const evidencesTracked = (await vaultEvidencesModel.get()).map(e => e.request);

    return request
      .post(`${vaultUrl}list.php`, body, {
        'Content-Type': 'application/x-www-form-urlencoded',
      })
      .then(res =>
        res.json
          .filter(e => !evidencesTracked.includes(e.request))
          .filter(e => statusToProcess.includes(e.status))
      );
  },

  async downloadPackage(evidence) {
    const fileName = await fileFromReadStream(
      `${evidence.request}.zip`,
      (await fetch(`${vaultUrl}/download/${evidence.filename}`)).body
    );

    return evidencePackage(fileName, evidence);
  },
};

export default vault;
