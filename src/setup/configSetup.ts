import fs from "fs";

import logger from "../logger";

export type Config = {
    botOptions: {
        automaticLinkDetection: boolean,
        automaticLinkDetectionErrorReply: boolean,
        allowCompressionOfLargeFiles: boolean,
        useVxFallback: boolean,
    },
    environmentOptions: {
        ffmpegPath: string,
        logToFile: boolean
    }
}

let config: Config = {
    botOptions: {
        automaticLinkDetection: true,
        automaticLinkDetectionErrorReply: true,
        allowCompressionOfLargeFiles: true,
        useVxFallback: true,
    },
    environmentOptions: {
        ffmpegPath: "",
        logToFile: false
    }
};

try {
    config = JSON.parse(fs.readFileSync(new URL("../../config/config.json", import.meta.url)).toString());
} catch (e) {
    logger.error('Failed to load config file, using defaults');
}

export default function getConfig(): Config {
    return config;
}