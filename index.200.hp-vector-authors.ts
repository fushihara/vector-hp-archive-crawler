import { sprintf } from "jsr:@std/fmt@1.0.2/printf"
import { dbInstance } from "./src/database.ts";
import { fetchHttpGetBinary, fetchHttpGetText } from "./src/fetchHttp.ts";
import { parseAnProfilePage } from "./src/htmlParsed.ts";
import { getLogger } from "./src/log.ts";
const logger = getLogger("index");
await dbInstance.init();
const MAX_AN_NUMBER = 64000;
for (let anNumber = 0; anNumber <= MAX_AN_NUMBER; anNumber++) {
  const url = sprintf("https://hp.vector.co.jp/authors/VA0%05d/", anNumber); //  anNumber
  do {
    try {
      await fetchHttpGetBinary(dbInstance, url, { check: false });
    } catch (error) {
      logger.warn(`HTTP GET失敗 ${error}`);
      await new Promise(resolve => { setTimeout(() => { resolve(null) }, 20 * 1000) });
      continue;
    }
  } while (false);
}
