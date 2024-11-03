import { dbInstance } from "./src/database.ts";
await dbInstance.init();
const { allVaList, titleMap } = await dbInstance.getAllVaList();
const allIaSaveUrlList = await dbInstance.getIaSaveUrlList();
const savePath = Deno.env.get("JSON_EXPORT_PATH")!;
await Deno.writeTextFile(savePath, JSON.stringify({
  allVaList,
  titleMap: Object.fromEntries(titleMap.entries()),
  allIaSaveUrlList,
}, null, 2));
console.log(`完了`);
