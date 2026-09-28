import { Readable } from 'stream';

//cc: As I understood, we are loading the whole file in memory before sending to the external service. I wonder why ?
// Why not stream the file from disk directly to http request ?

/** Where the xml the service produced for each segmentation is kept, by its file name. */
interface SegmentationXmlStore {
  store(xmlFilename: string, content: Readable): Promise<void>;

  /** Removing an xml that is not there is not an error. */
  remove(xmlFilename: string): Promise<void>;
}

export type { SegmentationXmlStore };
