import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VideoMetadata } from "@vp/shared";

const exec = promisify(execFile);

interface ProbeStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
}

/** Probe a media file with ffprobe → normalized metadata. */
export async function probe(path: string): Promise<Required<Pick<VideoMetadata, "height">> & VideoMetadata & { duration: number }> {
  const { stdout } = await exec("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    path,
  ]);
  const data = JSON.parse(stdout) as {
    streams: ProbeStream[];
    format?: { duration?: string; bit_rate?: string };
  };
  const v = data.streams.find((s) => s.codec_type === "video");
  const a = data.streams.find((s) => s.codec_type === "audio");

  return {
    width: v?.width ? Number(v.width) : undefined,
    height: v?.height ? Number(v.height) : 0,
    duration: Number(data.format?.duration ?? 0),
    videoCodec: v?.codec_name,
    audioCodec: a?.codec_name,
    bitrate: data.format?.bit_rate ? Number(data.format.bit_rate) : undefined,
  };
}
