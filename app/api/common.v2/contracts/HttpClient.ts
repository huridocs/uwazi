import { File } from 'api/files.v2/model/File';
import { HttpField } from './HttpField';

type PostFormDataInput = {
  url: string;
  fields: Record<string, HttpField>;
  files: Record<string, File[]>;
};

type GetInput = {
  url: string;
};

interface HttpClient {
  postFormData<T>(input: PostFormDataInput): Promise<T>;
  get<Response>(input: GetInput): Promise<Response>;
}

export type { PostFormDataInput, HttpClient, GetInput };
