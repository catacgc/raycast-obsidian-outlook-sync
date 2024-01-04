import { getPreferenceValues, showHUD, showToast, Toast, updateCommandMetadata } from "@raycast/api";
import Style = Toast.Style;
import EmailService from "./services/email";
import { Preferences } from "./components/emails";
import { ObsidianService } from "./services/obsidian";
import { readFile } from "node:fs/promises";
import axios from "axios";
import * as https from "https";

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  await updateCommandMetadata({ subtitle: "Started sync" });

  const outlook = new EmailService();

  const obsidian = new ObsidianService(preferences);

  const folders = preferences.todos_folder.split(",").map(it => it.trim());

  for (const folder of folders) {
    console.log(`fetching folder: ${folder}`)
    const emails = await outlook.getGroupedEmail(folder);

    for (const email of emails) {
      const archived = await outlook.archiveConversation(email);
      const link = archived[0].webLink;
      const subject = archived[0].subject;

      await updateCommandMetadata({ subtitle: `Sync ${subject}` });

      try {
        // await obsidian.addDailyNote(`- [${subject}](${link}) #email/${folder.toLowerCase()}`);
        await obsidian.saveEmail(`\n- [${subject}](${link}) #email/${folder.toLowerCase()} date::${archived[0].receivedDateTime}`);
      } catch (e) {
        console.log(e);
      }
    }
  }


  await updateCommandMetadata({ subtitle: `Synced emails to daily note` });
}