import path from 'path';
import zipFile from 'api/utils/zipFile';
import { fileFromReadStream } from 'api/files/filesystem';

const matchJson = entry => path.extname(entry.fileName) === '.json';
const matchVideo = entry => path.extname(entry.fileName) === '.mp4';
const matchScreenshot = entry => path.extname(entry.fileName) === '.png';

const parseJson = (json, evidence) => {
  if (json) {
    return JSON.parse(json);
  }
  return { title: evidence.request };
};

const createFile = async (stream, evidence, extension) => {
  if (stream) {
    await fileFromReadStream(`${evidence.request}.${extension}`, stream);
  }
};

const evidencePackage = (filePath, evidence) => {
  const zip = zipFile(filePath);

  return {
    async json() {
      const jsonContent = await zip.getFileContent(matchJson);
      return parseJson(jsonContent, evidence);
    },

    async video() {
      const video = await zip.findReadStream(matchVideo);
      await createFile(video, evidence, 'mp4');
      return video;
    },

    async screenshot() {
      const screenshot = await zip.findReadStream(matchScreenshot);
      await createFile(screenshot, evidence, 'png');
      return screenshot;
    },

    async evidences() {
      return [await this.json(), await this.video(), await this.screenshot()];
    },
  };
};

export default evidencePackage;
