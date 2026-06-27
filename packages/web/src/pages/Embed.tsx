import { useParams } from "react-router-dom";
import { VideoSurface } from "../components/VideoSurface";
import { hlsMasterUrl } from "../api";

/**
 * Public, chrome-less player for sharing/embedding. Plays the HLS master
 * directly — works for public videos (the API serves those anonymously) and
 * shows a playback error for private ones.
 */
export function Embed() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <div className="grid min-h-screen place-items-center bg-black p-2">
      <div className="w-full max-w-[1100px]">
        <VideoSurface videoId={id} directUrl={hlsMasterUrl(id)} />
      </div>
    </div>
  );
}
