import axios from "axios";
import * as https from "https";
import { readFile } from "node:fs/promises";
import * as fs from "fs";
import { Preferences } from "../components/emails";
import { ProcessedEmailMessage } from "./email";

export class ObsidianService {

  private PATH = '.obsidian/plugins/obsidian-local-rest-api/data.json'
  private readonly configFile: string;
  private folder: string;

  constructor(pref: Preferences) {
    this.configFile = `${pref.vault}/${this.PATH}`
    this.folder = `${pref.vault}/${pref.emailFolder}`
  }

  private getFileSystemCompatibleName(str) {
    // Remove special characters and replace them with an underscore
    const sanitizedStr = str.replace(/[^a-zA-Z0-9]/g, ' ');
    
    // Remove leading and trailing spaces
    const trimmedStr = sanitizedStr.trim();
    
    // Remove multiple consecutive spaces and replace them with a single space
    const finalStr = trimmedStr.replace(/\s+/g, ' ');
    
    return finalStr;
  }

  async saveEmailMessage(email: ProcessedEmailMessage, folder: string) {
    const link = email.webLink;
    const subject = email.subject;
    const date = new Date();

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear()
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const contentPath = `${this.folder}/${year}/${month}`;
    fs.mkdirSync(this.folder, {recursive: true})

    fs.mkdirSync(contentPath, {recursive: true})
    const index = `${this.folder}/Emails.md`

    const slug = this.getFileSystemCompatibleName(email.subject).substring(0, 30) + `-${formattedDate}.eml`;

    const isTodo = folder.toLowerCase().includes("todo") || folder.toLowerCase().includes("task");

    const header = `---
emailLink: ${link}
created: ${formattedDate}
from: "[[${email.sender.emailAddress.name}]]"
tags: [email]
---`

    const todo = isTodo ? `\n\n- [ ] [${subject}](${link})` : ""

    const fullMarkdown = `${header}${todo}

[${email.subject}](${link})

${email.markdownBody}
    `

    fs.appendFile(`${contentPath}/${slug}.md`, fullMarkdown, function (err) {
      if (err) throw err;
    });

    const markdown = `- [ ] [[${slug}|${subject}]] [link](${link})`;

    fs.appendFile(index, "\n" + markdown, function (err) {
      if (err) throw err;
    });
  }

  async saveEmail(markdown: string) {
    const index = `${this.folder}/Emails.md`

    fs.appendFile(index, markdown, function (err) {
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