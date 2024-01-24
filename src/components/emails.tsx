import {
  Action,
  ActionPanel,
  Clipboard,
  getPreferenceValues,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import EmailService, { Conversation, ProcessedEmailMessage } from "../services/email";

export interface Preferences {
  todos_folder: string;
  emailFolder: string;
  vault: string;
}

export function ListEmails(folder: string) {
  const { push } = useNavigation();
  const [isLoading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const outlook = new EmailService();
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    (async () => {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Fetching emails",
      });

      outlook
        .getGroupedEmail(folder)
        .then(
          (success) => {
            toast.hide();
            setConversations(success);
          },
          (reason) => {
            showToast({ title: JSON.stringify(reason) });
          }
        )
        .catch((err) => showToast({ title: err }))
        .finally(() => setLoading(false));
    })();
  }, []);

  async function toDo(msg: ProcessedEmailMessage) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Moving to ToDo`,
      message: msg.subject,
    });

    const conversation = conversations.find((it) => it.conversationId == msg.conversationId);
    setConversations(conversations.filter((it) => it.conversationId != msg.conversationId));

    for (const msg of conversation.emails) {
      const moved = await outlook.moveMessage(msg.id, preferences.todos_folder).finally(() => {
        toast.style = Toast.Style.Success;
        toast.title = `Moved`;
        toast.message = msg.subject;
      });

      await Clipboard.copy(`[Email: ${moved.subject}](${moved.webLink})`);
      await showToast({ title: "Copied todo link to clipboard", message: moved.subject });
    }
  }

  async function archive(msg: ProcessedEmailMessage) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Archiving`,
      message: msg.subject,
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
      message: msg.subject,
    });

    const conversation = conversations.find((it) => it.conversationId == msg.conversationId);

    setConversations(conversations.filter((it) => it.conversationId != msg.conversationId));

    for (const it of conversation.emails) {
      await archive(it);
    }
  }

  return (
    <List isLoading={isLoading} isShowingDetail filtering={true}>
      {conversations.map((convo) =>
        convo.emails.slice(0, 1).map((it) => (
          <List.Item
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open" url={it.webLink} />
                <Action title="Move to ToDo" onAction={() => toDo(it)} shortcut={{ modifiers: ["ctrl"], key: "1" }} />
                <Action
                  title="Archive"
                  onAction={() => archiveMessage(it)}
                  shortcut={{ modifiers: ["ctrl"], key: "e" }}
                />
              </ActionPanel>
            }
            keywords={it.bodyPreview.split(" ")}
            key={it.id}
            title={it.subject}
            detail={<List.Item.Detail markdown={it.markdownBody} />}
            subtitle={convo.emails.length > 1 ? `+ ${convo.emails.length - 1} more` : ""}
          ></List.Item>
        ))
      )}
    </List>
  );
}
