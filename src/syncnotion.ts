import { getPreferenceValues, showHUD, showToast, Toast, updateCommandMetadata } from "@raycast/api";
import Style = Toast.Style;
import { SyncService } from "./services/syncService";
import NotionService from "./services/notion";
import EmailService from "./services/email";
import { Preferences } from "./components/emails";

export default async function Command() {

  const sync = new SyncService(new NotionService(), new EmailService())

  const preferences = getPreferenceValues<Preferences>();

  await updateCommandMetadata({subtitle: "Started sync"})

  const number = await sync.sync(preferences.notion_folder)

  await updateCommandMetadata({subtitle: `Synced ${number} emails`})
}