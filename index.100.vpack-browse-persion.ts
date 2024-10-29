import { sprintf } from "jsr:@std/fmt@1.0.2/printf"
import { dbInstance } from "./src/database.ts";
import { fetchHttpGetText } from "./src/fetchHttp.ts";
import { parseAnProfilePage } from "./src/htmlParsed.ts";
import { getLogger } from "./src/log.ts";
const logger = getLogger("index");
await dbInstance.init();
const MAX_AN_NUMBER = 64000;
fetchHttpGetText.isLogEnable = false;
for (let anNumber = 0; anNumber <= MAX_AN_NUMBER; anNumber++) {
  const url = sprintf("https://www.vector.co.jp/vpack/browse/person/an0%05d.html", anNumber); //  anNumber
  const { htmlText } = await fetchHttpGetText(dbInstance, url, { check: false, encoding: "shift-jis" });
  const urlList = await parseAnProfilePage(htmlText);
  if (urlList) {
    urlList.urlList.forEach(u => {
      logger.debug(`${anNumber} ${u}`);
    });
  }
}
