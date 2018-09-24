import { spawn } from 'child-process-promise';

import EventEmitter from 'events';

export default class PDF extends EventEmitter {
  constructor(filepath) {
    super();
    this.filepath = filepath;
    this.optimizedPath = filepath;
  }

  async extractText() {
    const result = await spawn('pdftotext', [this.filepath, '-'], { capture: ['stdout', 'stderr'] });
    const pages = result.stdout.split('\f').slice(0, -1);
    return {
      fullText: pages.reduce((memo, page, index) => ({ ...memo, [index + 1]: page.replace(/(\S+)(\s?)/g, `$1[[${index + 1}]]$2`) }), {}),
      totalPages: pages.length
    };
  }

  convert() {
    return this.extractText();
  }
}
