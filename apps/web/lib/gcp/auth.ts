// apps/web/lib/gcp/auth.ts
import "server-only";
import { GoogleAuth } from "google-auth-library";

let _googleClient: any = null;

export async function getAccessToken(): Promise<string> {
  if (!_googleClient) {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    _googleClient = await auth.getClient();
  }
  const { token } = await _googleClient.getAccessToken();
  if (!token) throw new Error("Failed to get access token");
  return token;
}