import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import logger from "../logger";

export default async function FFProbe(url: string): Promise<FfprobeData | null> {
    try {
        return await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(url, (err, data) => {
                if (data) {
                    resolve(data);
                }

                logger.debug(err);
                resolve(null);
            })
        });
    } catch (e) {
        logger.debug(e);
        return null;
    }
}