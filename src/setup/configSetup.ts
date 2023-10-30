import fs from "fs";

let config = JSON.parse(fs.readFileSync(new URL("../../config/config.json", import.meta.url)).toString());

export type Config = {
    automaticLinkDetection: boolean,
    automaticLinkDetectionErrorReply: boolean,
    allowCompressionOfLargeFiles: boolean
}

export default function getConfig(): Config {
    return config;
}