import { sprintf } from "jsr:@std/fmt@1.0.2/printf"
import { dbInstance } from "./src/database.ts";
import { fetchHttpGetBinary, fetchHttpGetText } from "./src/fetchHttp.ts";
import { parseAnProfilePage } from "./src/htmlParsed.ts";
import { getLogger } from "./src/log.ts";
const logger = getLogger("index");
await dbInstance.init();
const MAX_AN_NUMBER = 64000;
fetchHttpGetBinary.isLogEnable = false;
const existVaList = new Set<number>();
for (let anNumber = 0; anNumber <= MAX_AN_NUMBER; anNumber++) {
  const url = sprintf("https://hp.vector.co.jp/authors/VA0%05d/", anNumber); //  anNumber
  const { status } = await fetchHttpGetBinary(dbInstance, url, { check: false });
  if (status == 200) {
    existVaList.add(anNumber);
    console.log(`FOUND ${url}`);
  }
}
console.log(`完了`);
