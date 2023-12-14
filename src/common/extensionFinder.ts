import { fileTypeFromStream } from "file-type";
import { Readable } from "stream";

export async function getExtensionFromUrl(url: string) {
    const { body } = await fetch(url);
    const stream = Readable.fromWeb(body as any);
    const result = await fileTypeFromStream(stream);
    return result?.ext || '';
}