import { LogEntry } from '../LogEntry.js';
import { LogWriter } from '../LogWriter.js';
import { toStandardJSONLine } from './StandardJSONWriter.js';

/** Same line as StandardJSONWriter, on stderr: for processes whose stdout carries data (CLI). */
export const StderrJSONWriter: LogWriter = (log: LogEntry) => {
  process.stderr.write(toStandardJSONLine(log));
};
