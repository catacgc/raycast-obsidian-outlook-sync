import axios from "axios";
import * as https from "https";
import { readFile } from "node:fs/promises";
import * as fs from "fs";
import { Preferences } from "../components/emails";

export class ObsidianService {

  private PATH = '.obsidian/plugins/obsidian-local-rest-api/data.json'
  private readonly configFile: string;
  private file: string;

  constructor(pref: Preferences) {
    this.configFile = `${pref.vault}/${this.PATH}`
    this.file = `${pref.vault}/${pref.emailfile}`
  }

  async saveEmail(markdown: string) {
    fs.appendFile(this.file, markdown, function (err) {
      if (err) throw err;
    });
  }

  async addDailyNote(markdown: string) {
    const restApiConfigStr = await readFile(this.configFile, { encoding: 'utf8' })
    const restApiData: {apiKey: string, crypto: {cert: string, privateKey: string, publicKey: string}} = JSON.parse(restApiConfigStr)

    console.log(restApiData.apiKey)
    const http = axios.create({
      baseURL: 'https://127.0.0.1:27124',
      // baseURL: 'http://127.0.0.1:27123',
      timeout: 2500,
      headers: {
        common: {
          Authorization: `Bearer ${restApiData.apiKey}`,
          "Content-Type": "text/markdown"
        }
      },
      httpsAgent: new https.Agent({
        key: restApiData.crypto.privateKey,
        ca: restApiData.crypto.cert,
      })
    });

    return http.post("/periodic/daily/", markdown)

  }


}