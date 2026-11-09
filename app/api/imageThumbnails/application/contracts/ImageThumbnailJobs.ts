/** Work this module hands to the job queue. */
interface ImageThumbnailJobs {
  create(filename: string): Promise<void>;
  countActive(filename: string): Promise<number>;
  deleteStored(paths: string[]): Promise<void>;
}

export type { ImageThumbnailJobs };
