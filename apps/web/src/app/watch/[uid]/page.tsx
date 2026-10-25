"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";

export default function WatchPage() {
  return (
    <Suspense>
      <Watch />
    </Suspense>
  );
}

function Watch() {
  const { uid } = useParams<{ uid: string }>();
  const heading = useSearchParams().get("t");

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      {heading && <h1 className="text-lg font-semibold">{heading}</h1>}
      <VideoPlayer videoUid={uid} />
    </div>
  );
}
