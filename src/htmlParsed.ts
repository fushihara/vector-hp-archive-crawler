// @deno-types="npm:@types/jsdom"
import { JSDOM } from "npm:jsdom@25.0.0";
import { delay } from "jsr:@std/async@1.0.6/delay";
import { z } from "npm:zod@3.23.8";
import { getLogger } from "./log.ts";
const loggerDeno = getLogger("htmlParser");

export async function parseAuthorListup(html: string) {
  const document = new JSDOM(html).window.document;
  await delay(1);
  const aList = document.querySelectorAll<HTMLAnchorElement>("a");
  const result: { authorId: string, hpTitle: string }[] = [];
  const allowVaUniqueId = ["yohko", "tfuruka1", "shurei", "sengoku"];
  for (const element of aList) {
    const href = element.href;
    const urlObj = new URL(href, "https://example.com");
    if (urlObj.host != "www.vector.co.jp" && urlObj.host != "hp.vector.co.jp") {
      continue;
    }
    const m = urlObj.pathname.match(/^\/authors\/(?<va_id>[^\/]+)\/$/);
    if (!m) {
      continue;
    }
    const vaId = String(m.groups!["va_id"]);
    if (!vaId.match(/^VA\d{6}$/)) {
      if (!allowVaUniqueId.includes(vaId)) {
        throw new Error(vaId);
      }
    }
    const innerText = element.textContent ?? "";
    if (vaId == "VA007219" && innerText == "戻る") {
      // 以下のURLでナビゲーションの戻るのリンク先が VA007219 になっている事を確認。明らかにおかしいので名指しでスキップ
      // https://web.archive.org/web/20121101213522im_/http://www.vector.co.jp/vpack/author/listpage.html
      continue;
    }
    result.push({ authorId: vaId, hpTitle: innerText });
  }
  return result;
}
/**
 * https://www.vector.co.jp/vpack/browse/person/an001687.html をパース
 * @param html 
 */
export async function parseAnProfilePage(html: string) {
  const document = new JSDOM(html).window.document;
  await delay(1);
  const d = document.querySelectorAll(`#v_wrapper>table`)[1];
  if (!d) {
    return null;
  }
  const e = d.querySelectorAll("tbody>tr")[1]
  if (!e) {
    return null;
  }
  const hpText = e.querySelector("font")?.textContent ?? "";
  if (hpText != "ホームページ") {
    throw new Error();
  }
  const urlList = [...e.querySelectorAll<HTMLAnchorElement>("a")].map(a => a.href);
  return { urlList: new Set(urlList) };
}
/**
 * https://entertainment.ha.com/c/catalog-print.zx?saleNo=7354&preview=1&compact=1&ic5=CatalogHome-AucType-CompactViewOfAuction-081817
 * の、全オークションアイテム一覧ページをパースする
 * @param html
 * @returns
 */
export async function parseAllAnctionItemList(html: string) {
  const document = new JSDOM(html).window.document;
  await delay(1);
  const anchorElementList = document.querySelectorAll<HTMLAnchorElement>(
    "#lot-results a",
  );
  const linkList: { url: string; title: string }[] = [];
  for (const aElement of anchorElementList) {
    const title = aElement.textContent ?? "";
    const href = aElement.href; // https://entertainment.ha.com/itm/movie-tv-memorabilia/costumes/p/7354-11001.s
    linkList.push({ url: href, title });
  }
  return linkList;
}
/**
 * https://entertainment.ha.com/itm/movie-tv-memorabilia/props/p/7354-11012.s
 * 形式の個別のオークションページを解析する
 * @param html
 */
export async function parseOneAuctionPage(html: string) {
  const document = new JSDOM(html).window.document;
  await delay(1);
  const images = (() => {
    const carouselImagesAttribute = document.querySelector("item-viewer")!.getAttribute(":carousel-images")!;
    const carouselImages = JSON.parse(carouselImagesAttribute);
    const zodType = z.array(z.object({
      width: z.number().int(),
      height: z.number().int(),
      URL: z.string().url(),
    })).transform((v) => {
      return v.map((i) => {
        const urlObj = new URL(i.URL);
        const setParam = urlObj.searchParams.get("set");
        if (setParam != null) {
          const newParam = setParam.replace(/,sizedata\[\d+x\d+\]/, "");
          urlObj.searchParams.set("set", newParam);
        }
        return {
          height: i.height,
          width: i.width,
          href: urlObj.toString(),
        };
      });
    });
    const result = zodType.parse(carouselImages);
    return result;
  })();
  /*
  const textBlocks = (() => {
    const span = document.querySelector(`span[itemprop="description"]`)!;
    const childNodes = [...span.childNodes];
    const ELEMENT_NODE = 1;
    const TEXT_NODE = 3;
    const nodex = childNodes.map<{ type: "node"; name: string; text: string } | { type: "text"; text: string }>((n) => {
      if (n.nodeType == ELEMENT_NODE) {
        return { type: "node", name: n.nodeName, text: (n.textContent ?? "").replaceAll("\n", " ") };
      } else if (n.nodeType == TEXT_NODE) {
        return { type: "text", text: (n.textContent ?? "").replaceAll("\n", " ") };
      } else {
        throw new Error();
      }
    }).filter((n) => {
      if (n.text.trim() != "") {
        return true;
      }
    });
    const textBlocks = childNodes.map((a) => a.textContent).filter((a) => a != null).map((a) => a.trim().replaceAll("\n", " ").trim()).filter((a) => a != "");
    const textBlocks2 = textBlocks.reduce(
      (acc: string[], curr: string) => {
        if (curr === "." && acc.length > 0) {
          // 前の要素とピリオドを結合
          acc[acc.length - 1] += curr;
        } else if (curr.startsWith(". ") && acc.length > 0) {
          acc[acc.length - 1] += ". ";
          acc[acc.length - 1] = acc[acc.length - 1].trim();
          acc.push(curr.substring(2));
        } else {
          // ピリオド以外ならそのまま追加
          acc.push(curr);
        }
        return acc;
      },
      [],
    );
    loggerDeno.info(textBlocks[0]);
    if (
      !textBlocks2.includes(
        "Important Notice Regarding Shipping Restrictions: Auctioneer is unable to direct shipment of any items purchased in this auction to the following countries: Burma, Cambodia, Hong Kong, Japan, Laos, Macao, Taiwan, the Republic of Korea, and Thailand. The Power Rangers series used suits, footage, and props from the Japanese Super Sentai show and combined them with its own unique storytelling techniques. Due to the nature of filming, suits worn by the principal cast of their respective Power Rangers seasons will be notated with their names in the title of the lot. For suits worn by the stunt team, we have omitted their names in the titles and indicated them as Hero or Action. There is a mix of stunt performer and main cast names in each costume lot.",
      )
    ) {
      throw new Error();
    }
    return textBlocks2;
  })();
  */
  return {
    images,
    //textBlocks,
  };
}