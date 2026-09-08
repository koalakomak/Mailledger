import { prisma } from "./db/prisma";

export const CATEGORIES = [
  "Food & Beverage",
  "Groceries",
  "Transportation",
  "Online Shopping",
  "Shopping",
  "Utilities",
  "Health",
  "Entertainment",
  "Financial Services",
  "Digital Wallet",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Aturan default berbasis kata kunci pada merchant/deskripsi. */
const DEFAULT_RULES: { keywords: string[]; category: Category }[] = [
  { keywords: ["gofood", "go-food", "go food", "resto", "restoran", "warung", "kopi", "cafe", "starbucks", "kfc", "mcdonald", "makan", "minuman", "ayam"], category: "Food & Beverage" },
  { keywords: ["alfamart", "indomaret", "superindo", "supermarket", "hypermarket", "sariroti", "ranch market"], category: "Groceries" },
  { keywords: ["goride", "gocar", "grab", "maxim", "taxi", "ojek", "bensin", "pertamina", "transjakarta", "busway", "kereta", "kai"], category: "Transportation" },
  { keywords: ["shopee", "tokopedia", "lazada", "blibli", "bukalapak", "tiktok shop", "tiktokshop"], category: "Online Shopping" },
  { keywords: ["uniqlo", "zalora", "elektronik", "fashion", "mall", "outlet", "zara", "h&m"], category: "Shopping" },
  { keywords: ["pln", "listrik", "token", "pdam", "internet", "wifi", "indihome", "first media", "pulsa", "telkomsel", "xl ", "smartfren"], category: "Utilities" },
  { keywords: ["bpjs", "rumah sakit", "rs ", "apotek", "klinik", "dokter", "obat", "kimia farma", "k24"], category: "Health" },
  { keywords: ["netflix", "spotify", "youtube", "steam", "playstation", "game", "cinema", "xxi", "disney", "vidio"], category: "Entertainment" },
  { keywords: ["transfer", "bi fast", "bi-fast", "bilyet", "giro"], category: "Financial Services" },
  { keywords: ["ovo", "gopay", "go-pay", "shopeepay", "dana ", "top up", "topup", "e-wallet"], category: "Digital Wallet" },
];

/** Kategorisasi default tanpa akses basis data (untuk kebutuhan ringan). */
export function classifyDefault(merchant: string, description: string): string {
  const hay = (merchant + " " + (description || "")).toLowerCase();
  for (const rule of DEFAULT_RULES) {
    if (rule.keywords.some((k) => hay.includes(k))) return rule.category;
  }
  return "General";
}

/** Kategorisasi transaksi: aturan user (prioritas), lalu default, lalu kategori parser. */
export async function categorizeTransaction(
  userId: string,
  merchant: string,
  description: string,
  fallbackCategory?: string | null
): Promise<string> {
  const hay = (merchant + " " + (description || "")).toLowerCase();

  const userRules = await prisma.userCategoryRule.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { keyword: true, category: true },
  });

  for (const rule of userRules) {
    if (rule.keyword && hay.includes(rule.keyword.toLowerCase())) {
      return rule.category;
    }
  }

  const def = classifyDefault(merchant, description);
  return def !== "General" ? def : fallbackCategory || "General";
}
