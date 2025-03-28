import fs from "fs";

import logger from "../logger";

export type Config = {
    botOptions: {
        automaticLinkDetection: boolean,
        automaticLinkDetectionErrorReply: boolean,
        allowCompressionOfLargeFiles: boolean,
        allowSplittingOfLargeFiles: boolean,
        useVxFallback: boolean,
        verboseErrorReply: boolean
    },
    environmentOptions: {
        ffmpegPath: string,
        cookiesPath: string,
        logToFile: boolean
    }
}

let config: Config = {
    botOptions: {
        automaticLinkDetection: true,
        automaticLinkDetectionErrorReply: true,
        allowCompressionOfLargeFiles: true,
        allowSplittingOfLargeFiles: true,
        useVxFallback: true,
        verboseErrorReply: false
    },
    environmentOptions: {
        ffmpegPath: "",
        cookiesPath: "",
        logToFile: false
    }
};

try {
    config = JSON.parse(fs.readFileSync(new URL("../../config/config.json", import.meta.url)).toString());
} catch (e) {
    logger.error('Failed to load config file, using defaults');
}

export function isValidPath(path: string) {
    try {
        fs.accessSync(path);
        return true;
    } catch (e) {
        return false;
    }
}


export default function getConfig(): Config {
    return config;
}