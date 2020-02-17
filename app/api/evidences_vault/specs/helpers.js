import backend from 'fetch-mock'; // eslint-disable-line
import path from 'path';
import yazl from 'yazl';
import fs from 'fs';

const createPackage = (data, fileName) =>
  fileName
    ? new Promise((resolve, reject) => {
        const zipfile = new yazl.ZipFile();
        zipfile.outputStream
          .pipe(fs.createWriteStream(path.join(__dirname, `/zips/${fileName}`)))
          .on('finish', resolve)
          .on('error', reject);

        zipfile.addBuffer(Buffer.from(''), 'md5.csv');

        if (data) {
          zipfile.addBuffer(Buffer.from(data), 'data.json');
          zipfile.addBuffer(Buffer.from('this is a fake video'), 'video.mp4');
          zipfile.addBuffer(Buffer.from('this is a fake image'), 'screenshot.png');
        }
        zipfile.end();
      })
    : Promise.resolve();

const mockVault = async evidences => {
  const response = evidences.map(e => e.listItem);

  backend.restore();

  backend.post(
    (url, options) =>
      url === 'https://public.evidence-vault.org/list.php' &&
      options.body.get('token') === 'auth_token' &&
      options.headers['Content-Type'] === 'application/x-www-form-urlencoded',
    JSON.stringify(response)
  );

  return Promise.all(
    evidences.map(async e => {
      if (e.listItem.filename) {
        await createPackage(JSON.stringify(e.jsonInfo), e.listItem.filename);
        const zipPackage = fs.createReadStream(path.join(__dirname, `zips/${e.listItem.filename}`));
        const zipResponse = new Response(zipPackage, {
          headers: { 'Content-Type': 'application/zip' },
        });
        backend.get(
          `https://public.evidence-vault.org//download/${e.listItem.filename}`,
          zipResponse
        );
      }
    })
  );
};

export { createPackage, mockVault };
