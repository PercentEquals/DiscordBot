import logger from "src/logger";

export default async function performance<T>(context: any, fn: (...args: [any]) => T, ...args: [any]) {
    logger.info(`Measuring ${fn.name}() performance`);

    const start = process.hrtime();
    const result = await fn.bind(context)(...args);
    const end = process.hrtime(start);

    logger.info(`Function ${fn.name}() took: ${end[0]}s and ${end[1] / 1000000}ms`);
    return result;
}