import { useEffect, useState } from "react";
import { apiFetch } from "./apiFetch";

function useAuthenticatedMediaUrl(src) {
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;

    setBlobUrl("");

    if (!src) return;

    async function loadMedia() {
      try {
        const response = await apiFetch(src);

        if (!response.ok) {
          throw new Error(`Media request failed: ${response.status}`);
        }

        const blob = await response.blob();

        if (cancelled) return;

        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (error) {
        console.error("Could not load private media:", error);
      }
    }

    loadMedia();

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  return blobUrl;
}

export function AuthenticatedImage({ src, alt = "", ...props }) {
  const blobUrl = useAuthenticatedMediaUrl(src);

  if (!blobUrl) return null;

  return <img {...props} src={blobUrl} alt={alt} />;
}

export function AuthenticatedAudio({ src, children, ...props }) {
  const blobUrl = useAuthenticatedMediaUrl(src);

  return (
    <audio {...props} src={blobUrl || undefined}>
      {children}
    </audio>
  );
}