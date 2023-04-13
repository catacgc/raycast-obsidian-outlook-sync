import { Action, ActionPanel, getPreferenceValues, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import EmailService, { Conversations, ProcessedEmailMessage } from "../services/email";
import NotionService from "../services/notion";
import SaveForm from "./saveform";
import ReplyForm from "./replyform";
import AiSummary from "./aisummary";

export function ListEmails(folder: string) {

  const { push } = useNavigation();
  const [isLoading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversations>([]);
  const notion = new NotionService();
  const outlook = new EmailService();
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    (async () => {

      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Fetching emails"
      });

      outlook.getGroupedEmail(folder)
        .then(
          success => {
            toast.hide();
            setConversations(success);
          },
          reason => {
            showToast({ title: JSON.stringify(reason) });
          }
        )
        .catch(err => showToast({ title: err }))
        .finally(() => setLoading(false));

    })();
  }, []);

  async function toDo(msg: ProcessedEmailMessage) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Moving to ToDo`,
      message: msg.subject
    });

    const conversation = conversations.find(it => it.conversationId == msg.conversationId);
    setConversations(conversations.filter(it => it.conversationId != msg.conversationId));

    for (const msg of conversation.emails) {
      await outlook.moveMessage(msg.id, preferences.todos_folder).finally(() => {
        toast.style = Toast.Style.Success;
        toast.title = `Moved`;
        toast.message = msg.subject;
      });
    }
  }

  async function archive(msg: ProcessedEmailMessage) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Archiving`,
      message: msg.subject
    });

    return outlook.archiveMessage(msg.id).finally(() => {
      toast.style = Toast.Style.Success;
      toast.title = `Archived`;
      toast.message = msg.subject;
    });
  }

  async function archiveMessage(msg: ProcessedEmailMessage) {
    await showToast({
      style: Toast.Style.Animated,
      title: `Archiving`,
      message: msg.subject
    });

    const conversation = conversations.find(it => it.conversationId == msg.conversationId);

    setConversations(conversations.filter(it => it.conversationId != msg.conversationId));

    for (const it of conversation.emails) {
      await archive(it);
    }
  }

  async function saveToNotion(msg: ProcessedEmailMessage) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Saving to Notion"
    });

    setConversations(conversations.filter(it => it.conversationId != msg.conversationId));

    toast.style = Toast.Style.Animated;
    toast.message = "Moving to Notion email folder";
    const email = await outlook.moveMessage(msg.id, preferences.notion_folder);

    toast.style = Toast.Style.Animated;
    toast.message = "Saving to Notion";
    await notion.saveToInbox({ ...msg, ...{ id: email.id, webLink: email.webLink } });

    toast.style = Toast.Style.Success;
    toast.message = "Saved";
  }

  const saveForm = (it: ProcessedEmailMessage) => <SaveForm onFormSubmit={(edited) => saveToNotion(edited)}
                                                            email={it}></SaveForm>;
  const createDraftForm = (it: ProcessedEmailMessage) => <ReplyForm onFormSubmit={(edited) => saveToNotion(edited)}
                                                                    email={it}></ReplyForm>;

  return (
    <List isLoading={isLoading} isShowingDetail enableFiltering={true}>
      {
        conversations.map(convo => convo.emails.slice(0, 1).map(it =>
          <List.Item
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="Open"
                  url={it.webLink}
                />
                <Action title="Save to Notion" onAction={() => push(saveForm(it))}
                        shortcut={{ modifiers: ["ctrl"], key: "2" }} />
                <Action title="Move to ToDo" onAction={() => toDo(it)}
                        shortcut={{ modifiers: ["ctrl"], key: "1" }} />
                <Action title="Archive" onAction={() => archiveMessage(it)}
                        shortcut={{ modifiers: ["ctrl"], key: "e" }} />
                <Action title="Create Draft Reply" onAction={() => push(createDraftForm(it))}
                        shortcut={{ modifiers: ["ctrl"], key: "r" }} />
                <Action title="Summarize"
                        onAction={() => push(<AiSummary email={it.bodyPreview}></AiSummary>)}
                        shortcut={{ modifiers: ["cmd"], key: "s" }} />

              </ActionPanel>
            }

            keywords={it.bodyPreview.split(" ")}
            key={it.id}
            title={it.subject}
            detail={
              <List.Item.Detail markdown={it.markdownBody} />
            }
            subtitle={convo.emails.length > 1 ? `+ ${convo.emails.length - 1} more` : ""}

          ></List.Item>))
      }
    </List>

  );
}

interface Preferences {
  todos_folder: string;
  notion_folder: string;
}