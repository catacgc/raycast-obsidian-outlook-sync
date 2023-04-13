import { closeMainWindow, List, PopToRootType } from "@raycast/api";
import NotionService from "./services/notion";
import {useEffect, useState} from "react";
import {useAsyncFunction} from "@raycast/utils/dist/useAsyncFunction";
import {PageObjectResponse, PartialPageObjectResponse} from "@notionhq/client/build/src/api-endpoints";
import { exec } from "child_process";
import { useExec } from "@raycast/utils"
import screencapture from "screencapture"
import { ListEmails } from "./components/emails";

export default function Command() {
    const notion = new NotionService()
    const [isLoading, setIsLoading] = useState(false)

    closeMainWindow({popToRootType: PopToRootType.Suspended})

    useEffect(() => {
        screencapture(function(err: any, imagePath: any) {
            if (err) {
                console.log(err);
                return;
            }

            console.log(imagePath);
        })
    }, [])

    // useEffect(() => {
    //     notion.createEmbed("Test 2", "https://adobe-my.sharepoint.com/:i:/r/personal/costache_adobe_com/Documents/Test/20220729_194409.jpg?csf=1&web=1&e=qnBTNw")
    //     .then(result => {
    //         console.log(result.id)
    //         setIsLoading(true)
    //     })
    //
    // }, [])

    useEffect(() => {



        notion.getPage("080527aa-ac49-444b-b14e-77a8a82296e0").then((r: PageObjectResponse | PartialPageObjectResponse) => {

        })
    }, [])

    return <List isLoading={isLoading}>
        <List.Item title={"test"}></List.Item>
    </List>
}