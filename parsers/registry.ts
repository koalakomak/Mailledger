import { BCAParser } from "./bca";
import { GoPayParser } from "./gopay";
import { OVOParser } from "./ovo";
import { ShopeeParser } from "./shopee";
import { TokopediaParser } from "./tokopedia";
import { MandiriParser } from "./mandiri";
import { GmailEmail, TransactionParser } from "./types";

export class ParserRegistry {
  private parsers: Map<string, TransactionParser> = new Map();

  constructor() {
    this.register(new BCAParser());
    this.register(new MandiriParser());
    this.register(new GoPayParser());
    this.register(new OVOParser());
    this.register(new ShopeeParser());
    this.register(new TokopediaParser());
  }

  register(parser: TransactionParser): void {
    this.parsers.set(parser.sourceSlug.toLowerCase(), parser);
  }

  getParser(sourceSlug: string): TransactionParser | undefined {
    return this.parsers.get(sourceSlug.toLowerCase());
  }

  findParserForEmail(email: GmailEmail): TransactionParser | undefined {
    const list = Array.from(this.parsers.values());
    for (const parser of list) {
      if (parser.canParse(email)) {
        return parser;
      }
    }
    return undefined;
  }

  getAllSources() {
    return Array.from(this.parsers.values()).map((p) => p.getSource());
  }
}

export const parserRegistry = new ParserRegistry();
export default parserRegistry;
