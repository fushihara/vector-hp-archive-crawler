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
    const SKIP_URL = [
      "www.codegear.com/jp",
      "http://縺ゅ％.net/",
      "http://縺ゅ％.net/java/java.cgi",
      // https://www.vector.co.jp/vpack/browse/person/an032283.html
      "http://hp.vector.co.jp/authors/VA032283",
      "miike@k-miike.net",
      "http://www.gdi-japan.�奇ｽ�/",
      "http://mokuzoken.com縲縲http://www.ytg.janis.or.jp/~catwerx/V00_00",
      "http://net-mci.�奇ｽ�/",
      /// httpsとhttp で同じURLが登録されていた
      "http://hp.vector.co.jp/authors/VA054629/",
      "to http://www.mediahuman.com/ja/"
    ];
    const filterdUrlList = [...urlList.urlList].filter(u => {
      if (SKIP_URL.includes(u)) {
        return false;
      }
      try {
        const urlObj = new URL(u);
        if (!urlObj.host.endsWith("hp.vector.co.jp")) {
          return false;
        }
      } catch (error) {
        const u_ = u;
        const url_ = url;
        debugger;
      }
      return true;
    });
    if (2 <= filterdUrlList.length) {
      debugger;
    } else if (filterdUrlList.length == 0) {
      // pass
    } else {
      logger.debug(`${String(anNumber).padStart(6)} ${filterdUrlList[0]}`);
      const path = new URL(filterdUrlList[0]).pathname.match(/^\/authors\/([^\/]+)/)![1];
      await dbInstance.upsertVectorMainAuthorPages(
        anNumber,
        path,
      );
    }
  }
}
console.log(`完了`);
