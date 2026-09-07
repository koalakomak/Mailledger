import { google } from "googleapis";
import { prisma } from "../db/prisma";
import { decrypt } from "../encryption";

export async function getGoogleAuthForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    throw new Error("No Google account connected for this user.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`
  );

  const refreshToken = account.encryptedRefreshToken
    ? decrypt(account.encryptedRefreshToken)
    : account.refresh_token || undefined;

  oauth2Client.setCredentials({
    access_token: account.access_token || undefined,
    refresh_token: refreshToken,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Listen for refresh tokens and update DB automatically
  oauth2Client.on("tokens", async (tokens) => {
    try {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token || undefined,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
    } catch (err) {
      console.error("Failed to update refreshed access token in database:", err);
    }
  });

  return { oauth2Client, account };
}

export async function getGmailClient(userId: string) {
  const { oauth2Client, account } = await getGoogleAuthForUser(userId);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return { gmail, account };
}

export async function getSheetsClient(userId: string) {
  const { oauth2Client, account } = await getGoogleAuthForUser(userId);
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  return { sheets, drive, account };
}
