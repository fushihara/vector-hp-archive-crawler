import { Database } from "./database.ts";
import { getLogger } from "./log.ts";
const loggerDeno = getLogger("fetchHttp");
type Opt = {
  reqHeader: Record<string, string>;
  loadCache: boolean;
  saveCache: boolean;
  primaryKey: string;
  check: boolean;
};
type OptText = {
  encoding: string | null;
}
const td = new TextEncoder();
const defaultOPt = {
  reqHeader: {},
  loadCache: true,
  saveCache: true,
  primaryKey: "",
  check: true,
} satisfies Opt;
const defaultOPtText = {
  reqHeader: {},
  loadCache: true,
  saveCache: true,
  primaryKey: "",
  check: true,
  encoding: null,
} satisfies Opt & OptText;
export async function fetchHttpGetText(db: Database, url: string | URL, opt_?: Partial<Opt & OptText>) {
  const option = Object.assign({}, defaultOPtText, opt_);
  const primaryKey = option.primaryKey == "" ? url.toString() : option.primaryKey;
  if (option.loadCache) {
    const dbCache = await db.getHttpText(primaryKey);
    if (dbCache) {
      if (fetchHttpGetText.isLogEnable) {
        const byte = td.encode(dbCache.htmlText);
        loggerDeno.info(`CACHE GET ${url} , ${byte.byteLength} byte`);
      }
      return { ...dbCache, isCache: true };
    }
  }
  if (fetchHttpGetText.isLogEnable) {
    loggerDeno.info(`HTTP  GET ${url}`);
  }
  await randomSleep(fetchHttpGetText.fetchIntervalSec * 1000);
  const response = await fetch(url, {
    headers: {
      ...option.reqHeader,
    },
  });
  const textDecoder = new TextDecoder(option.encoding ?? "utf-8");
  const htmlTextBuffer = await response.arrayBuffer();
  const htmlText = textDecoder.decode(htmlTextBuffer);
  if (option.check && !response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const responseHeaderObj = Object.fromEntries(response.headers);
  if (option.saveCache) {
    await db.upsertHttpResponseText({
      primaryKey: primaryKey,
      url: url.toString(),
      requestMethod: "GET",
      requestHeader: option.reqHeader,
      responseCode: response.status,
      responseHeader: responseHeaderObj,
      responseText: htmlText,
      insertProgramVersion: "",
    });
  }
  return { htmlText, status: response.status, isCache: false, responseHeaderObj };
}
fetchHttpGetText.isLogEnable = true;
fetchHttpGetText.fetchIntervalSec = 1;

export async function fetchHttpGetBinary(db: Database, url: string | URL, opt_?: Partial<Opt>) {
  const option = Object.assign({}, defaultOPt, opt_);
  const primaryKey = option.primaryKey == "" ? url.toString() : option.primaryKey;
  if (option.loadCache) {
    const dbCache = await db.getHttpBinary(primaryKey);
    if (dbCache) {
      if (fetchHttpGetBinary.isLogEnable) {
        const byte = dbCache.binaryData;
        loggerDeno.info(`CACHE GET ${url} , ${byte.byteLength} byte`);
      }
      return { ...dbCache, isCache: true };
    }
  }
  if (fetchHttpGetBinary.isLogEnable) {
    loggerDeno.info(`HTTP  GET ${url}`);
  }
  await randomSleep(fetchHttpGetBinary.fetchIntervalSec * 1000);
  const response = await fetch(url, {
    headers: {
      ...option.reqHeader,
    },
  });
  const buffer = await response.arrayBuffer();
  if (option.check && !response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const uint8Buffer = new Uint8Array(buffer, 0, buffer.byteLength);
  const responseHeaderObj = Object.fromEntries(response.headers);
  if (option.saveCache) {
    await db.upsertHttpResponseBinary({
      primaryKey: primaryKey,
      url: url.toString(),
      requestMethod: "GET",
      requestHeader: option.reqHeader,
      responseCode: response.status,
      responseHeader: responseHeaderObj,
      responseBinary: uint8Buffer,
      insertProgramVersion: "",
    });
  }
  return { binaryData: uint8Buffer, status: response.status, isCache: false, responseHeader: responseHeaderObj };
}
fetchHttpGetBinary.isLogEnable = true;
fetchHttpGetBinary.fetchIntervalSec = 1;
async function randomSleep(maxMs: number) {
  const sleepMs = Math.max(0, maxMs - (maxMs * Math.random() * 0.1));
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, sleepMs);
  });
}