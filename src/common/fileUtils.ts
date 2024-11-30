import { Readable } from "stream";
import { finished } from "stream/promises";

import fs from "fs";

async function downloadFileStream(url: string, options?: RequestInit) {
    if (!url) {
        throw new Error('No url provided!');
    }

    if (!url.startsWith('http')) {
        throw new Error('Invalid url provided!');
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Could not download from ${url}`);
    }

    return Readable.fromWeb(response.body as any);
}

export async function downloadFile(url: string, path: string, options?: RequestInit) {
    if (!url || !path) {
        throw new Error('No url/path provided!');
    }

    const stream = fs.createWriteStream(path);

    try {
        await finished((await downloadFileStream(url, options)).pipe(stream));
        return path;
    } catch (e) {
        stream.close();
        throw e;
    }
}