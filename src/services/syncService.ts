import EmailService from "./email";
import { getPreferenceValues } from "@raycast/api";
import NotionService from "./notion";

export class SyncService {

  constructor(private notion: NotionService, private email: EmailService) {
  }

  async sync(folder: string) {
    const conversations = await this.email.getGroupedEmail(folder)

    for (const it of conversations) {
      const conv = await this.email.archiveConversation(it)
      await this.notion.saveToInbox(conv.at(0))
    }

    return conversations.length
  }

}