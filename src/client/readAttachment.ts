import type { Attachment } from "../shared/api.ts";

const MAX_FILE_BYTES = 15_000_000;

export function readAttachment(f: File): Promise<Attachment> {
  if (f.size > MAX_FILE_BYTES) return Promise.reject(new Error("That file is too big. Try a file under 15 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: f.name, type: f.type || "text/plain", data: String(reader.result).split(",")[1] });
    reader.onerror = () => reject(new Error("That file can't be read. Try another one."));
    reader.readAsDataURL(f);
  });
}
