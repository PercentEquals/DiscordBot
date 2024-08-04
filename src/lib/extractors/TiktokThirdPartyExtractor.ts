import fs from "fs";

import { validateUrl } from "../../common/validateUrl";

import { downloadFile } from "../../common/fileUtils";

import FileBasedExtractor from "./FileBasedExtractor";
import FFProbe from "../FFprobeProcessor";

export default class TiktokThirdPartyExtractor extends FileBasedExtractor {
    constructor(
        private thirdPartyUrlProvider: (url: string) => Promise<string>
    ) {
        super();
    }

    public async extractUrl(url: string): Promise<boolean> {
        try {
            const urlObj = new URL(url);
            this.id = validateUrl(urlObj);

            if (!urlObj.hostname.includes('tiktok')) {
                return false;
            }

            await downloadFile(
                await this.thirdPartyUrlProvider(url),
                `cache/${this.getId()}`
            )
            
            if (!fs.existsSync(`cache/${this.getId()}`)) {
                return false;
            }

            if(!await FFProbe(`cache/${this.getId()}`)) {
                return false;
            }

            return true;
        } catch (e) {
            this.dispose();
            throw e;
        }
    }
}