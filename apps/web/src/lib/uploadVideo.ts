"use client";

import * as tus from "tus-js-client";

// Videoyu parça parça (tus) doğrudan Cloudflare Stream'e yükler.
// Büyük dosyalarda bağlantı koparsa kaldığı yerden devam eder.
export function uploadVideo(
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let mediaId: string | null = null;

    const upload = new tus.Upload(file, {
      endpoint: "/api/upload",
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { name: file.name, filetype: file.type },
      onBeforeRequest(req) {
        // Yetki başlığı sadece bizim sunucumuza gider, Cloudflare'e gitmez
        if (req.getMethod() === "POST") req.setHeader("Authorization", `Bearer ${accessToken}`);
      },
      onAfterResponse(_req, res) {
        mediaId ??= res.getHeader("stream-media-id") ?? null;
      },
      onProgress(sent, total) {
        onProgress(Math.round((sent / total) * 100));
      },
      onError: reject,
      onSuccess() {
        if (mediaId) resolve(mediaId);
        else reject(new Error("Cloudflare video kimliği alınamadı"));
      },
    });
    upload.start();
  });
}
