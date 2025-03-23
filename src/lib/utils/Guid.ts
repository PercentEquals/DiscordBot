import crypto from "crypto";

export function GUID() {
    return crypto.randomBytes(16).toString("hex");
}