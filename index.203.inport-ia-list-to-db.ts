import { z } from "npm:zod@3.23.8"
import { TextLineStream } from "jsr:@std/streams@1.0.1/text-line-stream";
import { dbInstance } from "./src/database.ts";
import { fetchHttpGetBinary } from "./src/fetchHttp.ts";
import { getLogger } from "./src/log.ts";
const logger = getLogger("index");
await dbInstance.init();
fetchHttpGetBinary.isLogEnable = false;
const inputData = await readLine(".saved/hp.vector.json");
await dbInstance.upsertIaSavedUrl(inputData);
console.log(`完了`);

async function readLine(filePath: string) {
  const zodType = z.array(z.string()).length(7)
  using f = await Deno.open(filePath);
  const readable = f.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  const result: {
    timestampStr: string,
    originalUrl: string,
    host: string,
    path: string,
    authorId: string,
    mimeType: string,
    statusCode: number,
    dataLength: number,
  }[] = [];
  for await (let data of readable) {
    if (data.startsWith("[[")) {
      data = data.slice(1);
    }
    if (data.endsWith("],") || data.endsWith("]]")) {
      data = data.slice(0, -1);
    }
    if (data == "") {
      continue;
    }
    const parsedData = zodType.parse(JSON.parse(data));
    if (parsedData[0] == "urlkey") {
      continue;
    }
    const timestampStr = z.string().regex(/^\d{14}$/).parse(parsedData[1]);
    const originalUrl = z.string().url().parse(parsedData[2]);
    const host = new URL(originalUrl).host;
    const path = new URL(originalUrl).pathname;
    const mimeType = z.string().parse(parsedData[3]);
    const statusCode = Number(z.string().regex(/^\d+$/).parse(parsedData[4]));
    const dataLength = Number(z.string().regex(/^\d+$/).parse(parsedData[6]));
    let authorId = "";
    {
      // /authors/tfuruka1/ohiraki/981020.gif
      const m = path.match(/^\/authors\/(?<author_id>[^\/]+)/);
      if (m) {
        authorId = String(m.groups!["author_id"]);
      }
    }
    // /authors/images/
    result.push({
      timestampStr: timestampStr,
      originalUrl: originalUrl,
      host: host,
      path: path,
      authorId: authorId,
      mimeType: mimeType,
      statusCode: statusCode,
      dataLength: dataLength,
    });
    console.log(`${host}${path}`);
  }
  return result;
}
