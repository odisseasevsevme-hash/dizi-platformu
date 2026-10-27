"use client";

import * as tus from "tus-js-client";

type UploadCredentials = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
};

// Videoyu parça parça (tus) doğrudan Bunny Stream'e yükler.
// Büyük dosyalarda bağlantı koparsa kaldığı yerden devam eder.
export async function uploadVideo(
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: file.name }),
  });
  if (!response.ok) throw new Error(await response.text());
  const { videoId, libraryId, expirationTime, signature } = (await response.json()) as UploadCredentials;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expirationTime),
        VideoId: videoId,
        LibraryId: libraryId,
      },
      metadata: { filetype: file.type, title: file.name },
      onProgress(sent, total) {
        onProgress(Math.round((sent / total) * 100));
      },
      onError: reject,
      onSuccess: () => resolve(videoId),
    });
    upload.start();
  });
}
