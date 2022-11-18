import * as fs from 'fs';

class CsvWriter {
    filePath: string;
    columns: string[];
    separator: string;
    writeStream: fs.WriteStream;

    constructor(filePath: string, columns: string[], separator: string = ',') {
        this.filePath = filePath;
        this.columns = columns;
        this.separator = separator;
        this.writeStream = fs.createWriteStream(this.filePath);
        this.writeStream.write(columns.join(separator));
        this.writeStream.write('\n');
    }

    writeLine(lineObject: any){
        const lineArray = this.columns.map(c => lineObject[c]);
        this.writeStream.write(lineArray.join(this.separator));
        this.writeStream.write('\n');
    }

    writeLines(lineObjects: any[]){
        lineObjects.forEach(lineObject => this.writeLine(lineObject));
    }

    close(){
        this.writeStream.end();
    }
}

export { CsvWriter };