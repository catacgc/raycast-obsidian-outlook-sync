import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import EmailService, { ProcessedEmailMessage } from "../services/email";

export default function ReplyForm({email, onFormSubmit}: { email: ProcessedEmailMessage, onFormSubmit: (msg: ProcessedEmailMessage) => void }) {

    const {pop} = useNavigation()
    const emailService = new EmailService()

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Create Draft" onSubmit={async (values: {body: string}) => {
                        const msg = await createDraftReply(values).finally(() => pop())
                        onFormSubmit(msg)
                    }}/>
                </ActionPanel>
            }
        >
        
        <Form.TextArea title="Draft Reply" id="body" autoFocus={true}/>
        <Form.TextArea title="Reply To" id="previous_body" defaultValue={email.markdownBody}/>
                
        </Form>)

    async function createDraftReply(values: {body: string}): Promise<ProcessedEmailMessage> {
        const toast = await showToast({
            style: Toast.Style.Animated,
            title: "Creating draft reply",
          });

        return await emailService.createDraft(email, values.body).finally(() => {
            toast.hide()
        });
    }
}