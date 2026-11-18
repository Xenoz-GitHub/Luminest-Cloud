"use client";

const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

export interface ImageKitUploadCredentials {
  publicKey: string;
  signature: string;
  expire: number;
  token: string;
  folder: string;
}

export interface ImageKitUploadResult {
  fileId: string;
  filePath: string;
  url: string;
}

/**
 * Upload an image straight from the browser to ImageKit. Credentials are
 * short-lived and scoped to this one upload, so the private key never reaches
 * the client. Files are uploaded as private and read back via signed URLs.
 */
export function uploadImageToImageKit({
  file,
  fileName,
  credentials,
  onProgress,
}: {
  file: File;
  fileName: string;
  credentials: ImageKitUploadCredentials;
  onProgress?: (percent: number) => void;
}): Promise<ImageKitUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", fileName);
  form.append("publicKey", credentials.publicKey);
  form.append("signature", credentials.signature);
  form.append("expire", String(credentials.expire));
  form.append("token", credentials.token);
  form.append("folder", credentials.folder);
  form.append("useUniqueFileName", "false");
  form.append("isPrivateFile", "true");
  form.append("overwriteFile", "false");

  return new Promise<ImageKitUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            fileId?: string;
            filePath?: string;
            url?: string;
          };
          if (!data.fileId || !data.filePath) {
            reject(new Error("ImageKit did not return a file id."));
            return;
          }
          resolve({
            fileId: data.fileId,
            filePath: data.filePath,
            url: data.url ?? "",
          });
        } catch {
          reject(new Error("The image upload response could not be read."));
        }
        return;
      }
      let detail = "";
      try {
        detail = (JSON.parse(xhr.responseText) as { message?: string }).message ?? "";
      } catch {
        detail = xhr.responseText.slice(0, 160);
      }
      reject(new Error(detail || `The image upload failed (${xhr.status}).`));
    };
    xhr.onerror = () =>
      reject(new Error("The connection dropped during the image upload."));
    xhr.send(form);
  });
}
