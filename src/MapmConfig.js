import fs from 'fs'

export class MapmConfig {
    constructor(fileName = 'mapm.json') {
        this.fileName = fileName;

        if (!fs.existsSync(fileName)) {
            this.config = {};
            return;
        }

        const file = fs.readFileSync(fileName, 'utf-8');

        if (!file) {
            this.config = {};
            return;
        }

        this.config = JSON.parse(file);
    }


    save() {
        const json = JSON.stringify(this.config, null, 2)
        fs.writeFileSync(this.fileName, json);
    }
}