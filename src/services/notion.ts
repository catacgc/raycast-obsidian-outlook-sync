import {getPreferenceValues} from "@raycast/api";
import {Client} from "@notionhq/client";
import {markdownToBlocks} from '@tryfabric/martian';
import TurndownService from "turndown";
import {ProcessedEmailMessage} from "./email";
import {CreatePageResponse} from "@notionhq/client/build/src/api-endpoints";

export interface Preferences {
    token: string
    db: string
}

export default class NotionService {

    private notion: Client
    private preferences: Preferences
    private turndown: TurndownService

    constructor() {
        this.preferences = getPreferenceValues<Preferences>();
        this.notion = new Client({auth: this.preferences.token})
        this.turndown = new TurndownService()
    }

    private isValidBlock(block: any): boolean {
        const isImage = block['type'] == 'image'
        if (isImage) {
            console.log(block)
        }
        const isValidImage = isImage && !(block['image']['external']['url'] as string).includes('cid:')


        return !isImage || isValidImage
    }

    async getPage(id: string) {
        return await this.notion.pages.retrieve({page_id: id})
    }

    async createEmbed(name: string, url: string) {
        return await this.notion.pages.create({
            parent: {database_id: this.preferences.db},
            properties: {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": name
                            }
                        }
                    ]
                }
            },
            children: [{
                embed: {
                    url: url
                }
            }]
        })
    }

    async saveToInbox(msg: ProcessedEmailMessage): Promise<CreatePageResponse> {
        let blocks = markdownToBlocks(msg.markdownBody)
        blocks = blocks.filter(it => this.isValidBlock(it))

        return await this.notion.pages.create({
            parent: {database_id: this.preferences.db},
            properties: {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": msg.subject
                            }
                        }
                    ]
                },
                "Tags": {
                    "multi_select": [{
                        name: "from:email"
                    }]
                },
                "URL": {
                    url: msg.webLink
                }
            },
            children: blocks
        })
    }
}