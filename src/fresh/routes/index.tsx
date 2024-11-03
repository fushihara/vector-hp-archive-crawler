import { format } from "jsr:@std/datetime@0.224.0/format"
import { type RouteContext } from "$fresh/server.ts";
import type { JSX } from "preact/jsx-runtime";
import { dbInstance } from "../../database.ts";
export default async function Page(req: Request, ctx: RouteContext) {
  ctx.basePath;// configでのbasePath
  ctx.url;// リクエストのURLオブジェクト。ホストは信用できないが、パスやsearchParamsの取得に使う
  const { allVaList, titleMap } = await dbInstance.getAllVaList();
  allVaList.length = 100;
  const elementList: JSX.Element[] = [];
  const iaSavedUrlList = await dbInstance.getIaSaveUrlList(allVaList);
  for (const vaIdStr of allVaList) {
    const index = allVaList.indexOf(vaIdStr) + 1;
    const vaIdNum = Number(vaIdStr.match(/VA(\d{6})/)![1]);
    const iasSavedUrlListId = iaSavedUrlList
      .filter(i => i.author_id == vaIdStr)
      .sort((a, b) => {
        if (a.path.toLowerCase() != b.path.toLowerCase()) {
          return a.path.toLowerCase().localeCompare(b.path.toLowerCase());
        } else {
          return a.timestamp_str.localeCompare(b.timestamp_str);
        }
      })
    const fullUrl = `https://hp.vector.co.jp/authors/${vaIdStr}/`;
    elementList.push(
      <h1 class="flex gap-4 items-baseline">
        <a href={fullUrl}>VA.{vaIdNum}</a>
        <span class="text-sm font-normal">{index}/{allVaList.length}</span>
      </h1>
    )
    if (iasSavedUrlListId.length == 0) {
      elementList.push(<>登録されているURLがありません</>)
    } else {
      const liElementList: JSX.Element[] = [];
      const datas: IASavedUrlTableProp["datas"] = [];
      for (const iaSavedUrl of iasSavedUrlListId) {
        let displayUrl = iaSavedUrl.path;
        if (!displayUrl.startsWith(`/authors/${vaIdStr}/`)) {
          throw new Error(displayUrl);
        }
        displayUrl = displayUrl.substring(`/authors/${vaIdStr}`.length);
        const iASavedTimeMs = (() => {
          const m = iaSavedUrl.timestamp_str.match(/^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2})(?<min>\d{2})(?<sec>\d{2})/)!;
          const d = new Date(`${Number(m.groups!["year"])}-${Number(m.groups!["month"])}-${Number(m.groups!["day"])} ${Number(m.groups!["hour"])}:${Number(m.groups!["min"])}:${Number(m.groups!["sec"])}`);
          return d.getTime();
        })();
        // 20240718114436
        datas.push({
          statusCode: iaSavedUrl.status_code,
          fileSizeByte: iaSavedUrl.data_length,
          mimeType: iaSavedUrl.mimetype,
          IAFullUrl: `https://web.archive.org/web/${iaSavedUrl.timestamp_str}/${iaSavedUrl.original_url}`,
          IADisplayUrl: displayUrl,
          IASavedTimeMs: iASavedTimeMs,
        })
      }
      elementList.push(<ul>{liElementList}</ul>);
      elementList.push(<IASavedUrlTable datas={datas}></IASavedUrlTable>);
    }
  }
  return (
    <div class="container mx-auto">
      {elementList}
    </div>
  );
}
type IASavedUrlTableProp = {
  datas: {
    statusCode: number,
    fileSizeByte: number,
    mimeType: string,
    IAFullUrl: string,
    IADisplayUrl: string,
    IASavedTimeMs: number,
  }[],
};
function IASavedUrlTable(prop: IASavedUrlTableProp) {
  const trElementList: JSX.Element[] = [];
  const numFormat = new Intl.NumberFormat('en-US');
  if (prop.datas.length == 0) {
    throw new Error();
  }
  const maxFileSize = prop.datas.map(d => d.fileSizeByte).reduce((a, b) => Math.max(a, b), 0);
  prop.datas.forEach(data => {
    const sizeBackgroundWidth = (data.fileSizeByte / maxFileSize) * 100;
    trElementList.push(
      <tr class="transition duration-300 ease-in-out hover:bg-gray-100" key={`${data.IAFullUrl}`}>
        <td class="border border-black px-1 py-0 text-right">{data.statusCode}</td>
        <td class="border border-black px-1 py-0 text-right relative">
          <div class="absolute h-full top-0 bg-green-200 right-0" style={{ "width": `${sizeBackgroundWidth}%` }}></div>
          <div class="relative">{numFormat.format(data.fileSizeByte)} byte</div>
        </td>
        <td class="border border-black px-1 py-0 text-left"><a href={data.IAFullUrl}>{data.IADisplayUrl}</a></td>
        <td class="border border-black px-1 py-0 text-left">{data.mimeType}</td>
        <td class="border border-black px-1 py-0 text-left">{format(new Date(data.IASavedTimeMs), "yyyy/MM/dd HH:mm:ss")}</td>
      </tr>
    );
  });
  return (<div class="p-2">
    <table class="border-collapse bg-white text-sm font-light text-gray-900 ">
      <thead class="text-md sticky top-0 bg-gray-100 font-medium">
        <tr>
          <th scope="col" class="whitespace-nowrap border border-black px-1 text-right" title="ステータスコード">St</th>
          <th scope="col" class="whitespace-nowrap border border-black px-1 text-right" title="ファイルサイズ">Size</th>
          <th scope="col" class="whitespace-nowrap border border-black px-1 text-left">URL</th>
          <th scope="col" class="whitespace-nowrap border border-black px-1 text-left">MimeType</th>
          <th scope="col" class="whitespace-nowrap border border-black px-1 text-left" title="InternetArchiveに保存された日時">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {trElementList}
      </tbody>
    </table>
  </div>
  );
}