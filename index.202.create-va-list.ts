import { sprintf } from "jsr:@std/fmt@1.0.2/printf"
import { dbInstance } from "./src/database.ts";
import { fetchHttpGetBinary, fetchHttpGetText } from "./src/fetchHttp.ts";
import { parseAnProfilePage } from "./src/htmlParsed.ts";
import { getLogger } from "./src/log.ts";
const logger = getLogger("index");
await dbInstance.init();
const MAX_VA_ID = 60700;
const vaIdSet = new Set<number>();
fetchHttpGetBinary.isLogEnable = false;
for (let vaId = 0; vaId < MAX_VA_ID; vaId++) {
  const requestUrl = `https://hp.vector.co.jp/authors/VA0${String(vaId).padStart(5, "0")}/`;
  const { status } = await fetchHttpGetBinary(dbInstance, requestUrl, { check: false });
  if (status == 404 || status == 403) {
    continue;
  } else if (status == 200) {
    console.log(`${requestUrl} ${status}`);
    vaIdSet.add(vaId);
  }else{
    throw new Error(`status code:${status}`);
  }
}
await dbInstance.upsertVaIdList(vaIdSet);
console.log(`完了. vaIdSet:${vaIdSet.size} items`);
