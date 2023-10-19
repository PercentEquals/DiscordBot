import fs from "fs";

export function debugJson(filename: string, json: any) {
    if (process.env.ENV?.toLowerCase?.() !== "dev") {
        return;
    }

    try {
        console.log(`[debug] Writing ${filename}.json`);
        fs.writeFileSync(`debug/${filename}.json`, JSON.stringify(json, null, 2));
    } catch (e) {
        console.log(e);
    }
}