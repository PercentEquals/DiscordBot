import fs from "fs";
import pino from "pino";
import getConfig from "./setup/configSetup";

const shouldLogToFile = getConfig().environmentOptions.logToFile;

const targets = [
    {
        level: 'info',
        target: 'pino-pretty',
        options: {}
    }
];

if (shouldLogToFile) {
    fs.mkdirSync('logs', { recursive: true });

    targets.push({
        level: 'debug',
        target: 'pino/file',
        options: {
            destination: 'logs/log.log'
        }
    });
}

const logger = pino({
    transport: {
        targets
    },
});

export default logger;