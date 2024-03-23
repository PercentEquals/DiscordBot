import { Readable } from "stream";
import { finished } from "stream/promises";

import fs from "fs";

export async function downloadFileStream(url: string, headers?: any) {
    const response = await fetch(url, headers);

    if (!response.ok) {
        throw new Error(`Could not download from ${url}`);
    }

    return Readable.fromWeb(response.body as any);
}

export async function downloadFile(url: string, path: string, headers?: any) {
    const stream = fs.createWriteStream(path);

    try {
        await finished((await downloadFileStream(url, headers)).pipe(stream));
        return path;
    } catch (e) {
        stream.close();
        throw e;
    }
}