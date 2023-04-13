import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import EmailService, { ProcessedEmailMessage } from "../services/email";
import { useState } from "react"
import NotionService from "../services/notion";

export default function SaveForm({email, onFormSubmit}: { email: ProcessedEmailMessage, onFormSubmit: (msg: ProcessedEmailMessage) => void }) {

    const {pop} = useNavigation()
    const [sub, setSub] = useState<string>(email.subject);

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Save to Notion" onSubmit={(values) => {
                            console.log(values.subject)
                            onFormSubmit({...email, ...{subject: values.subject, markdownBody: values.body}})
                            pop()
                        }
                    }/>
                </ActionPanel>
            }
        >
            <Form.TextField
                id="subject"
                title="Title"
                placeholder="Enter notion title"
                autoFocus={true}
                // error={nameError}
                // onChange={dropNameErrorIfNeeded}
                value={sub}
                onChange={(value) => {
                    setSub(value)
                }}
            ></Form.TextField>

            <Form.TextArea id="body" defaultValue={email.markdownBody}/>
                
        </Form>)
}