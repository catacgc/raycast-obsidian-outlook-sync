import {Action, ActionPanel, Detail, useNavigation, useUnstableAI} from "@raycast/api"

interface AiSummaryProps {
    email: string
}

export default function AiSummary(props: AiSummaryProps) {
    const {pop} = useNavigation();

    const {isLoading, data} = useUnstableAI(`Summarize the following email:

    ${props.email}`, {creativity: 'low'})

    return (
        <Detail markdown={data}

                actions={
                    <ActionPanel>
                        <Action title="Pop" onAction={pop}/>
                    </ActionPanel>
                }
        />
    )
}