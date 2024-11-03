import { sprintf } from "jsr:@std/fmt@1.0.2/printf"
import { Database as SqliteDb } from "jsr:@db/sqlite@0.11";
import { DenoSqlite3Dialect } from "jsr:@soapbox/kysely-deno-sqlite@2.2.0";
import { Generated, Kysely, sql } from "npm:kysely@0.27.4";
interface DbType {
  http_request_result: {
    id: Generated<number>;
    primary_key: string;
    url: string;
    request_method: "GET" | "POST";
    request_header: string;
    response_code: number;
    response_header: string;
    is_binary: number;
    response_text: string | null;
    response_binary: Uint8Array | null;
    insert_program_version: string;
    created_at: string;
    updated_at: string;
  };
  http_request_result_parsed_data: {
    id: Generated<number>;
    primary_key: string;
    parsed_data: string;
    parsed_program_version: string;
    created_at: string;
    updated_at: string;
  };
  va_id_list: {
    id: Generated<number>;
    va_id: number,
  };
  ia_saved_url: {
    id: Generated<number>;
    timestamp_str: string,
    original_url: string,
    host: string,
    path: string,
    author_id: string,
    mimetype: string,
    status_code: number,
    data_length: number,
  }
  vector_author_listup: {
    id: Generated<number>;
    ia_timestamp: string;
    author_id: string;
    hp_title: string;
  }
  vector_main_author_pages: {
    id: Generated<number>;
    vector_main_va: number;
    hp_space_va: string;
  }
}
export class Database {
  private db!: Kysely<DbType>;
  async init() {
    this.db = new Kysely<DbType>({
      dialect: new DenoSqlite3Dialect({
        database: new SqliteDb("./database.db"),
      }),
      // log(event): void {
      //   if (event.level === "query") {
      //     console.log(event.query.sql);
      //     console.log(event.query.parameters);
      //   }
      // },
    });
    await sql<DbType[]>`PRAGMA foreign_keys = ON`.execute(this.db);
    await sql<DbType[]>`
      CREATE TABLE IF NOT EXISTS http_request_result(
        id                     INTEGER NOT NULL PRIMARY KEY,
        primary_key            TEXT    NOT NULL UNIQUE CHECK(primary_key<>''),
        url                    TEXT    NOT NULL,
        request_method         TEXT    NOT NULL CHECK(request_method='GET' OR request_method='POST'),
        request_header         TEXT    NOT NULL CHECK( json_valid(request_header) ),
        response_code          INTEGER NOT NULL CHECK( 0 < response_code ),
        response_header        TEXT    NOT NULL CHECK( json_valid(response_header) ),
        is_binary              INTEGER NOT NULL CHECK(is_binary = 1 OR is_binary = 0),
        response_text          TEXT NULL,
        response_binary        BLOB NULL,
        created_at             TEXT NOT NULL,
        updated_at             TEXT NOT NULL,
        insert_program_version TEXT NOT NULL,
        check ( 
          ( is_binary = 1 AND response_text IS     NULL AND response_binary IS NOT NULL ) OR
          ( is_binary = 0 AND response_text IS NOT NULL AND response_binary IS     NULL )
        )
      ) strict;`.execute(this.db);
    await sql<
      DbType[]
    >`CREATE INDEX IF NOT EXISTS http_request_result_primary_key ON http_request_result(primary_key)`
      .execute(this.db);
    await sql<DbType[]>`
      CREATE TABLE IF NOT EXISTS va_id_list(
        id                     INTEGER NOT NULL PRIMARY KEY,
        va_id                  INTEGER NOT NULL UNIQUE CHECK(0<=va_id)
      ) strict;`.execute(this.db);
    await sql<DbType[]>`
      CREATE TABLE IF NOT EXISTS ia_saved_url(
        id             INTEGER NOT NULL PRIMARY KEY,
        timestamp_str  TEXT NOT NULL CHECK( timestamp_str <> '' ),
        original_url   TEXT NOT NULL CHECK( original_url <>'' ),
        host           TEXT NOT NULL CHECK( host <>'' ),
        path           TEXT NOT NULL CHECK( path <>'' ),
        author_id      TEXT NOT NULL,
        mimetype       TEXT NOT NULL CHECK( mimetype <> '' ),
        status_code    INTEGER NOT NULL CHECK( 0 < status_code),
        data_length    INTEGER NOT NULL CHECK( 0 < data_length),
        UNIQUE(timestamp_str,original_url)
      ) strict;`.execute(this.db);
    await sql<DbType[]>`CREATE INDEX IF NOT EXISTS ia_saved_url_author_id ON ia_saved_url(author_id)`.execute(this.db);
    // vector_author_listup
    await sql<DbType[]>`
      CREATE TABLE IF NOT EXISTS vector_author_listup(
        id           INTEGER NOT NULL PRIMARY KEY,
        ia_timestamp TEXT    NOT NULL CHECK(ia_timestamp<>''),
        author_id    TEXT    NOT NULL CHECK(author_id<>''),
        hp_title     TEXT    NOT NULL ,
        UNIQUE(ia_timestamp,author_id)
      ) strict;`.execute(this.db);
    await sql<DbType[]>`CREATE INDEX IF NOT EXISTS vector_author_listup_author_id ON vector_author_listup(author_id)`.execute(this.db);
    // vector_main_author_pages
    await sql<DbType[]>`
      CREATE TABLE IF NOT EXISTS vector_main_author_pages(
        id             INTEGER NOT NULL PRIMARY KEY,
        vector_main_va INTEGER NOT NULL CHECK(0<=vector_main_va),
        hp_space_va    TEXT    NOT NULL CHECK(hp_space_va<>''),
        UNIQUE(vector_main_va),
        UNIQUE(vector_main_va,hp_space_va)
      ) strict;`.execute(this.db);
    await sql<DbType[]>`CREATE INDEX IF NOT EXISTS vector_main_author_pages_ ON vector_main_author_pages(hp_space_va)`.execute(this.db);
  }
  async getAllVaList() {
    const result = new Set<string>();
    const titleMap = new Map<string, string[]>();
    await this.db.selectFrom("va_id_list").select("va_id").execute().then(vaIdList => {
      vaIdList.forEach(vaId => {
        result.add(sprintf("VA%06d", Number(vaId.va_id)));
      })
    });
    await this.db.selectFrom("vector_main_author_pages").select("hp_space_va").execute().then(vaIdList => {
      vaIdList.forEach(vaId => {
        result.add(vaId.hp_space_va);
      })
    });
    await this.db
      .selectFrom("ia_saved_url")
      .select("author_id")
      .groupBy("author_id")
      .execute()
      .then(dbResponse => {
        dbResponse.forEach(oneData => {
          result.add(oneData.author_id);
        })
      });
    await this.db
      .selectFrom("vector_author_listup")
      .select(["author_id", "hp_title"])
      .groupBy(["author_id", "hp_title"])
      .execute()
      .then(dbResponse => {
        dbResponse.forEach(oneData => {
          result.add(oneData.author_id);
          const titleMapData = titleMap.get(oneData.author_id);
          if (titleMapData == null) {
            titleMap.set(oneData.author_id, [oneData.hp_title]);
          } else {
            titleMapData.push(oneData.hp_title);
          }
        })
      });
    return {
      allVaList: [...result].filter(i => i.match(/^VA\d{6}$/)).sort(),
      titleMap,
    }
  }
  async upsertVectorMainAuthorPages(vectorMainVa: number, upSpaceVa: string) {
    await this.db.insertInto("vector_main_author_pages")
      .values({
        vector_main_va: vectorMainVa,
        hp_space_va: upSpaceVa,
      }).onConflict((cb) => {
        return cb.column("vector_main_va").doNothing();
      }).execute();
  }
  async upsertVectorAuthorListup(iaTimestamp: string, hpList: { authorId: string, hpTitle: string }[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("vector_author_listup")
        .where("vector_author_listup.ia_timestamp", "==", iaTimestamp)
        .execute();
      const chunkedList = chunk(hpList, 100);
      for (const chunked of chunkedList) {
        await trx.insertInto("vector_author_listup").values([...chunked].map(data => {
          return {
            ia_timestamp: iaTimestamp,
            author_id: data.authorId,
            hp_title: data.hpTitle,
          };
        })).execute();
      }
    });
  }

  /**
   * @param vaIdList ["VA123456"] の様な文字列の配列を渡す
   * @returns 
   */
  async getIaSaveUrlList(vaIdList?: string[]) {
    let query = this.db
      .selectFrom("ia_saved_url")
      .selectAll();
    if (vaIdList) {
      query = query.where(wref => {
        return wref.eb(
          wref.ref("author_id"),
          "in",
          vaIdList,
        )
      });
    }
    const result = await query.execute();
    return result;
  }
  async upsertIaSavedUrl(inputData: {
    timestampStr: string,
    originalUrl: string,
    host: string,
    path: string,
    authorId: string,
    mimeType: string,
    statusCode: number,
    dataLength: number,
  }[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom("ia_saved_url").execute();
      const chunkedList = chunk(inputData, 100);
      for (const chunked of chunkedList) {
        await trx.insertInto("ia_saved_url").values([...chunked].map(data => {
          return {
            timestamp_str: data.timestampStr,
            original_url: data.originalUrl,
            host: data.host,
            path: data.path,
            author_id: data.authorId,
            mimetype: data.mimeType,
            status_code: data.statusCode,
            data_length: data.dataLength
          };
        })).execute();
      }
    });
  }
  async upsertVaIdList(vaIdList: Set<number>) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom("va_id_list").execute();
      return await trx.insertInto("va_id_list").values([...vaIdList].map(vaid => {
        return { va_id: vaid };
      })).execute();
    });
  }
  async getHttpText(primaryKey: string) {
    const result = await this.db.selectFrom("http_request_result")
      //.leftJoin("http_request_result_parsed_data", "http_request_result.primary_key", "http_request_result_parsed_data.primary_key")
      .select([
        "http_request_result.id",
        "http_request_result.response_text",
        "http_request_result.response_code",
        "http_request_result.response_header",
      ])
      .where("http_request_result.primary_key", "=", primaryKey)
      .where("http_request_result.is_binary", "=", 0)
      .limit(1)
      .executeTakeFirst();
    if (!result) {
      return null;
    }
    return {
      htmlText: result.response_text!,
      status: result.response_code,
      responseHeader: JSON.parse(result.response_header),
    };
  }
  async getHttpBinary(primaryKey: string) {
    const result = await this.db.selectFrom("http_request_result")
      //.leftJoin("http_request_result_parsed_data", "http_request_result.primary_key", "http_request_result_parsed_data.primary_key")
      .select([
        "http_request_result.id",
        "http_request_result.response_code",
        "http_request_result.response_header",
        "http_request_result.response_binary",
      ])
      .where("http_request_result.primary_key", "=", primaryKey)
      .where("http_request_result.is_binary", "=", 1)
      .limit(1)
      .executeTakeFirst();
    if (!result) {
      return null;
    }
    return {
      binaryData: result.response_binary!,
      status: result.response_code,
      responseHeader: JSON.parse(result.response_header),
    };
  }
  async upsertHttpResponseText(params: upsertHttpResponseTextParams) {
    await this.db.insertInto("http_request_result")
      .values({
        primary_key: params.primaryKey,
        url: params.url.toString(),
        request_method: params.requestMethod,
        request_header: sortRecord(params.requestHeader),
        response_code: params.responseCode,
        response_header: sortRecord(params.responseHeader),
        is_binary: 0,
        response_text: params.responseText,
        updated_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
        created_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
        insert_program_version: params.insertProgramVersion,
      }).onConflict((cb) => {
        return cb.column("primary_key").doUpdateSet({
          url: params.url.toString(),
          request_method: params.requestMethod,
          request_header: sortRecord(params.requestHeader),
          response_code: params.responseCode,
          response_header: sortRecord(params.responseHeader),
          is_binary: 0,
          response_text: params.responseText,
          updated_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
          //created_at: sql`strftime('%F %R:%f',${Date.now()},'unixepoch')`,
          insert_program_version: params.insertProgramVersion,
        });
      }).execute();
  }
  async upsertHttpResponseBinary(params: upsertHttpResponseBinaryParams) {
    await this.db.insertInto("http_request_result")
      .values({
        primary_key: params.primaryKey,
        url: params.url.toString(),
        request_method: params.requestMethod,
        request_header: sortRecord(params.requestHeader),
        response_code: params.responseCode,
        response_header: sortRecord(params.responseHeader),
        is_binary: 1,
        response_binary: params.responseBinary,
        updated_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
        created_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
        insert_program_version: params.insertProgramVersion,
      }).onConflict((cb) => {
        return cb.column("primary_key").doUpdateSet({
          url: params.url.toString(),
          request_method: params.requestMethod,
          request_header: sortRecord(params.requestHeader),
          response_code: params.responseCode,
          response_header: sortRecord(params.responseHeader),
          is_binary: 1,
          response_binary: params.responseBinary,
          updated_at: sql`strftime('%F %R:%f',${Date.now() / 1000},'unixepoch')`,
          //created_at: sql`strftime('%F %R:%f',${Date.now()},'unixepoch')`,
          insert_program_version: params.insertProgramVersion,
        });
      }).execute();
  }
}
type upsertHttpResponseTextParams = {
  primaryKey: string;
  url: string | URL;
  requestMethod: "GET" | "POST";
  requestHeader: Record<string, string>;
  responseCode: number;
  responseHeader: Record<string, string>;
  responseText: string;
  insertProgramVersion: string;
};
type upsertHttpResponseBinaryParams = {
  primaryKey: string;
  url: string | URL;
  requestMethod: "GET" | "POST";
  requestHeader: Record<string, string>;
  responseCode: number;
  responseHeader: Record<string, string>;
  responseBinary: Uint8Array;
  insertProgramVersion: string;
};
type upsertAuctionImageListParam = {
  pageUrl: string;
  imageUrlList: string[];
};
function sortRecord(data: Record<string, string>) {
  const sortedData = Object.fromEntries(
    Object.entries(data).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    }),
  );
  const jsonString = JSON.stringify(sortedData, null, 2);
  return jsonString;
}
function chunk<T = any>(list: T[], len: number) {
  if (len <= 0) {
    throw new Error();
  }
  const result: T[][] = [];
  for (let i = 0; i < list.length; i += len) {
    result.push(list.slice(i, i + len));
  }
  return result;
}
export const dbInstance = new Database();