#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";
import { dbInstance } from "../database.ts";
console.log(`dev.ts実行`)
await dbInstance.init();

await dev(import.meta.url, "./main.ts", config);