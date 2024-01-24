import axios from "axios";
import { DateTime } from "luxon";
import TurndownService from "turndown";
import { authorize } from "./oauth";

export interface EmailAddress {
  emailAddress: {
    name: string;
    address: string;
  };
}

export interface ListResponse {
  value: EmailMessage[];
  "@odata.nextLink"?: string;
}

export interface EmailMessage {
  id: string;
  webLink: string;
  subject: string;
  conversationId: string;
  bodyPreview: string;
  sender: EmailAddress;
  receivedDateTime: string;
  toRecipients: EmailAddress[];
  inferenceClassification: "focused" | "other";
  body: {
    content: string;
  };
}

export type ProcessedEmailMessage = EmailMessage & {
  markdownBody: string;
};

export type Conversation = { conversationId: string; emails: ProcessedEmailMessage[] };

interface FolderResponse {
  value: {
    id: string;
    displayName: string;
  }[];
  "@odata.nextLink"?: string;
}

export interface EventResponse {
  subject: string;
  bodyPreview: string;
  start: {
    dateTime: string;
    timezone: string;
  };
  end: {
    dateTime: string;
    timezone: string;
  };
  attendees: {
    emailAddress: {
      name: string;
      address: string;
    };
    status: {
      response: string;
    };
  }[];
}

export default class EmailService {
  private turndown = new TurndownService();

  async createDraft(email: ProcessedEmailMessage, draft: string): Promise<ProcessedEmailMessage> {
    const token = await authorize();
    const url = `https://graph.microsoft.com/v1.0/me/messages/${email.id}/createReply`;
    console.log(url);
    const reply = await axios.post<EmailMessage>(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(reply.data);

    const updateUrl = `https://graph.microsoft.com/v1.0/me/messages/${reply.data.id}`;
    console.log("update: %s", updateUrl);
    const emailDraft = await axios.patch<EmailMessage>(
      updateUrl,
      {
        body: {
          contentType: "HTML",
          content: draft + reply.data.body.content,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(emailDraft);

    return { ...emailDraft.data, ...{ markdownBody: this.markdown(emailDraft.data) } };
  }

  async getGroupedEmail(folder: string): Promise<Conversation[]> {
    const mails = await this.getEmail(folder);

    const grouped: Conversation[] = [];
    for (const mail of mails) {
      if (!grouped.find((it) => it.conversationId == mail.conversationId)) {
        grouped.push({ conversationId: mail.conversationId, emails: [] });
      }

      const conversation = grouped.find((it) => it.conversationId == mail.conversationId);
      conversation.emails.push(mail);
    }

    return grouped;
  }

  async getEmail(folder: string): Promise<ProcessedEmailMessage[]> {
    const token = await authorize();
    const id = await this.getMailFolderId(folder);
    let link = [
      `https://graph.microsoft.com/v1.0/me/mailFolders/${id}/messages`,
      "?$orderby=receivedDateTime+DESC",
      "&$filter=receivedDateTime ge 2022-01-01T00:00:00Z",
      //"and inferenceClassification eq 'focused'",
      "&top=33",
      "&select=id,webLink,subject,bodyPreview,receivedDateTime,sender,toRecipients,inferenceClassification,body,conversationId",
    ].join("");

    console.log(link);

    let messages: EmailMessage[] = [];
    let pages = 0;

    while (link != null && pages < 3) {
      const events = await axios.get<ListResponse>(link, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      link = events.data["@odata.nextLink"];
      messages = messages.concat(events.data.value);
      pages++;
    }

    return messages.map((it) => {
      return { ...it, ...{ markdownBody: this.markdown(it) } };
    });
  }

  markdown(it: EmailMessage) {
    const markdown = `
**From:** *${it.sender.emailAddress.name}*
**To:** *${it.toRecipients
      .map((i) => i.emailAddress.name)
      .join(", ")
      .substring(0, 150)}*
**Date:** *${DateTime.fromISO(it.receivedDateTime).toJSDate().toLocaleString()}*

---
    
    ${this.toMd(it.body.content)} 
    `;
    return markdown;
  }

  toMd(it: string) {
    let msg = this.turndown.turndown(it);

    // escape weird image tags in email messages like [![xls](cid:invalidicon) link text](link) => [link text](link)
    msg = msg.replaceAll(/!\[.+?\)/g, "");

    // comments
    msg = msg.replaceAll(/<!--.+-->/g, "");

    // team meetings
    const body = msg.split(/\\_+/g);
    return body.filter((it) => !it.includes("Meeting ID") && it.length > 0).join("\n");
    // return msg
  }

  async moveMessage(id: string, folderId: string): Promise<ProcessedEmailMessage> {
    const token = await authorize();
    const url = `https://graph.microsoft.com/v1.0/me/messages/${id}/move`;
    console.log(url);
    const events = await axios.post<EmailMessage>(
      url,
      { destinationId: folderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(events.data);

    return { ...events.data, ...{ markdownBody: this.markdown(events.data) } };
  }

  async moveConversation(conv: Conversation, folderId: string): Promise<ProcessedEmailMessage[]> {
    const archived: ProcessedEmailMessage[] = [];
    for (const email of conv.emails) {
      archived.push(await this.moveMessage(email.id, folderId));
    }

    return archived;
  }

  async archiveConversation(conv: Conversation): Promise<ProcessedEmailMessage[]> {
    const archived: ProcessedEmailMessage[] = [];
    for (const email of conv.emails) {
      archived.push(await this.archiveMessage(email.id));
    }

    return archived;
  }

  async archiveMessage(id: string): Promise<ProcessedEmailMessage> {
    const token = await authorize();
    const url = `https://graph.microsoft.com/v1.0/me/messages/${id}/move`;
    console.log(url);
    const events = await axios.post<EmailMessage>(
      url,
      { destinationId: "archive" },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(events.data);

    return { ...events.data, ...{ markdownBody: this.markdown(events.data) } };
  }

  async getMailFolderId(name: string) {
    const token = await authorize();

    let fullResponse: FolderResponse = { value: [] };
    let events = await axios.get<FolderResponse>("https://graph.microsoft.com/v1.0/me/mailFolders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fullResponse = events.data;
    let nextLink = events.data["@odata.nextLink"];

    while (nextLink) {
      events = await axios.get<FolderResponse>(nextLink, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      nextLink = events.data["@odata.nextLink"];
      console.log(nextLink);

      fullResponse.value = fullResponse.value.concat(events.data.value);
    }

    fullResponse.value.forEach((it) => console.log(it.displayName));

    return fullResponse.value.find((it) => it.displayName == name)?.id;
  }

  async getCalendarEvents(): Promise<EventResponse[]> {
    const token = await authorize();
    const events = await axios.get<{
      value: EventResponse[];
    }>("https://graph.microsoft.com/v1.0/me/calendar/events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(events.data);

    return events.data.value;
  }
}
