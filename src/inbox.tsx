import { ListEmails } from "./components/emails";


//unused now
//    {
//      "name": "inbox",
//      "title": "Inbox Zero",
//      "description": "Quickly cleanup inbox",
//      "mode": "view"
//    },
export default function Command() {
    return ListEmails("Inbox")
}