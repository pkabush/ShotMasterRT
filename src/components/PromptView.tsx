import { Accordion, Button } from "react-bootstrap";
import { Project } from "../classes/Project";
import { CollapsibleAccordionCard } from "./Atomic/CollapsibleContainer";
import { observer } from "mobx-react-lite";
import EditableJsonTextField from "./EditableJsonTextField";


export const PromptView = observer(() => {

    const project = Project.getProject();
    const data = project.promptinfo;

    if (!data) return null;
    return <>
        Prompt View

        <Button onClick={() => { project.log() }}> LOG</Button>
        <Accordion>
            <CollapsibleAccordionCard label="PromptPresets" headerExtra={
                <>
                    <Button onClick={() => {
                        const finalName = prompt("Please enter something:");
                        if (!finalName) return;
                        data?.updateField(finalName, { type: "folder", contents: {} })
                    }}> Add Folder</Button>
                    <Button onClick={() => {
                        const finalName = prompt("Please enter something:");
                        if (!finalName) return;
                        data?.updateField(finalName, { type: "string", contents: "" })
                    }}> Add String</Button>
                </>
            }
            >
                {
                    Object.entries(data.data).map(([key, value]) => {
                        if (value.type == "string") {                           

                            return <EditableJsonTextField
                                localJson={data}
                                field={`${key}/contents`}
                                collapsed={true}
                                key = {key}
                                headerExtra={<Button size="sm" onClick={() => {
                                    data.updateField(`${key}`, undefined);

                                }}>delete</Button>} />

                        }
                        return <>
                            <div key={key}>
                                `${key}`
                            </div>
                        </>
                            ;
                    })
                }


            </CollapsibleAccordionCard>
        </Accordion>
    </>;
});
