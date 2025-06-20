import fs from "fs";

import { validateUrl } from "src/common/validateUrl";

import { downloadFile } from "src/common/fileUtils";

import FileBasedExtractor from "./FileBasedExtractor";
import FFProbe from "src/lib/ffmpeg/FFprobeProcessor";

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

            return await FFProbe(`cache/${this.getId()}`) !== null;
        } catch (e) {
            this.dispose();
            throw e;
        }
    }
}