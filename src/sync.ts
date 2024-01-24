import { getPreferenceValues, updateCommandMetadata } from "@raycast/api";
import EmailService from "./services/email";
import { Preferences } from "./components/emails";
import { ObsidianService } from "./services/obsidian";

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();
  await updateCommandMetadata({ subtitle: "Started sync" });

  const outlook = new EmailService();

  const obsidian = new ObsidianService(preferences);

  const folders = preferences.todos_folder.split(",").map((it) => it.trim());

  for (const folder of folders) {
    console.log(`fetching folder: ${folder}`);
    const emails = await outlook.getGroupedEmail(folder);
    const keep = await outlook.getMailFolderId("Keep");

    for (const email of emails) {
      const archived = await outlook.moveConversation(email, keep);
      const subject = archived[0].subject;

      await updateCommandMetadata({ subtitle: `Sync ${subject}` });

      try {
        await obsidian.saveEmailMessage(archived[0], folder);
      } catch (e) {
        console.log(e);
      }
    }
  }

  await updateCommandMetadata({ subtitle: `Synced emails to daily note` });
}