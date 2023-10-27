import fs from "fs";

let config = JSON.parse(fs.readFileSync(new URL("../../config/config.json", import.meta.url)).toString());

export default function getConfig() {
    return config;
}