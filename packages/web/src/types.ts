// Mirrors the API's response shapes (see packages/shared). Kept local so the
// web bundle has no node-oriented workspace dependency.

export type VideoStatus =
  | "pending"
  | "analyzing"
  | "transcoding"
  | "thumbnails"
  | "packaging"
  | "completed"
  | "failed";

export type Visibility = "private" | "public";

export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number;
  videoCodec?: string;
  audioCodec?: string;
  bitrate?: number;
}

/** A row from GET /api/videos (list) — also the base of the detail view. */
export interface Video {
  id: string;
  title: string;
  original_filename: string;
  status: VideoStatus;
  visibility: Visibility;
  metadata: VideoMetadata | null;
  master_playlist_key: string | null;
  created_at: string;
  // present on GET /api/videos/:id (joined job)
  progress?: number;
  stage?: string | null;
  error_message?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export type OtpPurpose = "register" | "login";

/** An OTP second-factor step. `devCode` is only present when SMTP is unconfigured. */
export interface OtpChallenge {
  challenge: "otp";
  email: string;
  devCode?: string;
}

/** Register/login either complete immediately or return an OTP challenge. */
export type AuthResult = AuthResponse | OtpChallenge;

export function isOtpChallenge(r: AuthResult): r is OtpChallenge {
  return "challenge" in r && r.challenge === "otp";
}

export interface AuthConfig {
  twoFactor: boolean;
  emailDelivery: boolean;
  google: boolean;
}

export interface StreamInfo {
  visibility: Visibility;
  url: string;
  token?: string;
  expiresIn?: number;
}
