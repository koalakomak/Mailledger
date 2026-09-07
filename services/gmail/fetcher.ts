import { getGmailClient } from "@/lib/google/client";
import { GmailEmail } from "@/parsers/types";

function decodeBase64(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (err) {
    return "";
  }
}

function extractEmailBody(payload: any): { plainText: string; html: string } {
  let plainText = "";
  let html = "";

  if (!payload) return { plainText, html };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      html += decoded;
    } else {
      plainText += decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const partBody = extractEmailBody(part);
      if (partBody.plainText) plainText += `\n${partBody.plainText}`;
      if (partBody.html) html += `\n${partBody.html}`;
    }
  }

  return { plainText: plainText.trim(), html: html.trim() };
}

export async function fetchEmailsForQuery(
  userId: string,
  query: string,
  options: { maxResults?: number; afterDate?: Date } = {}
): Promise<GmailEmail[]> {
  const { gmail } = await getGmailClient(userId);

  let finalQuery = query;
  if (options.afterDate) {
    const dateFormatted = `${options.afterDate.getFullYear()}/${options.afterDate.getMonth() + 1}/${options.afterDate.getDate()}`;
    finalQuery = `${query} after:${dateFormatted}`;
  }

  const maxResults = options.maxResults || 50;
  const collectedIds: { id?: string | null; threadId?: string | null }[] = [];
  let pageToken: string | undefined;

  // Paginate through Gmail until we reach the cap or run out of pages,
  // so matching emails are not silently dropped after the first page.
  while (collectedIds.length < maxResults) {
    const want = Math.min(500, maxResults - collectedIds.length);
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: finalQuery,
      maxResults: want,
      pageToken,
    });

    const messages = listRes.data.messages || [];
    collectedIds.push(...messages);
    pageToken = listRes.data.nextPageToken || undefined;
    if (!pageToken || messages.length === 0) break;
  }

  const results: GmailEmail[] = [];

  for (const item of collectedIds) {
    if (!item.id) continue;

    try {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: item.id,
        format: "full",
      });

      const data = msgRes.data;
      const headers = data.payload?.headers || [];

      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const subject = getHeader("Subject");
      const sender = getHeader("From");
      const dateHeader = getHeader("Date");
      const receivedAt = dateHeader ? new Date(dateHeader) : new Date(parseInt(data.internalDate || "0", 10));

      const { plainText, html } = extractEmailBody(data.payload);

      results.push({
        id: item.id,
        threadId: item.threadId || undefined,
        subject,
        sender,
        receivedAt: isNaN(receivedAt.getTime()) ? new Date() : receivedAt,
        snippet: data.snippet || "",
        plainText,
        html,
      });
    } catch (err) {
      console.error(`Error fetching message details for ${item.id}:`, err);
    }
  }

  return results;
}
