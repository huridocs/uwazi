import { File } from 'api/files.v2/model/File';
import { HttpField } from './HttpField';

type PostFormDataInput = {
  url: string;
  fields: Record<string, HttpField>;
  files: Record<string, File[]>;
};

interface HttpClient {
  postFormData<T>(input: PostFormDataInput): Promise<T>;
}

export type { PostFormDataInput, HttpClient };
