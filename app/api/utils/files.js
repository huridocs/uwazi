import fs from 'fs';

function deleteFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function deleteFiles(files) {
  return Promise.all(files.map((file) => deleteFile(file)));
}

export {deleteFiles, deleteFile};
