import { Readable } from 'stream';

/** Where the xml the service produced for each segmentation is kept, by its file name. */
interface SegmentationXmlStore {
  store(xmlFilename: string, content: Readable): Promise<void>;

  /** Removing an xml that is not there is not an error. */
  remove(xmlFilename: string): Promise<void>;
}

export type { SegmentationXmlStore };
