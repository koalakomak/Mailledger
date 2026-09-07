import "dotenv/config";
import { prisma } from "./lib/db/prisma";
import { getGmailClient } from "./lib/google/client";
import { parseTransactionDate } from "./parsers/utils";

function decode(encoded: string): string {
  try { const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/"); return Buffer.from(b64, "base64").toString("utf-8"); }
  catch { return ""; }
}
function extractHtml(payload: any): string {
  let html = "";
  if (!payload) return html;
  if (payload.body && payload.body.data) { const d = decode(payload.body.data); if (payload.mimeType === "text/html") html += d; }
  if (payload.parts && Array.isArray(payload.parts)) for (const p of payload.parts) html += " " + extractHtml(p);
  return html;
}
async function main() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("no user");
  const txs = await prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 6 });
  const { gmail } = await getGmailClient(user.id);
  for (const tx of txs) {
    console.log("\nDB: amount", tx.amount.toString(), "| stored:", new Date(tx.transactionDate).toISOString(), "| email:", tx.emailMessageId);
    try {
      const msg = await gmail.users.messages.get({ userId: "me", id: tx.emailMessageId, format: "full" });
      const html = extractHtml(msg.data.payload);
      const i = html.search(/Tanggal/i);
      const seg = i >= 0 ? html.slice(i, i + 500).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "(tidak ketemu Tanggal)";
      console.log("  sekitar Tanggal:", seg.slice(0, 220));
      const d = parseTransactionDate(html);
      console.log("  parse(raw):", d ? d.toISOString() : "NULL");
    } catch (e: any) { console.log("  error", e.message); }
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error("ERR:", e); process.exit(1); });
