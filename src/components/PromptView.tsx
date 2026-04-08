import { Accordion, Button } from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { CollapsibleAccordionCard } from "./Atomic/CollapsibleContainer";
import EditableJsonTextField from "./EditableJsonTextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCirclePlus, faFolderPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { PromptDropdownButton } from "./PromptPresets/PromptDropdownButton";


export const PromptView = observer(() => {
    const project = Project.getProject();
    const data = project.promptinfo;

    if (!data) return null;

    return (
        <>
            <Accordion>
                <PromptFolder label="PromptPresets" />
            </Accordion>
        </>
    );
});


type Props = {
    path?: string; // path to the folder node (NOT contents)
    label: string;
};

export const PromptFolder = observer(({ path = "", label }: Props) => {
    const project = Project.getProject();
    const data = project.promptinfo;

    if (!data) return null;

    // 👇 Always resolve children via /contents
    const contents = path
        ? data.getField(`${path}/contents`) || {}
        : data.data;

    return (<div className="mb-2">
        <CollapsibleAccordionCard
            closedColor="#2c4c3f"
            openColor="#3b8c48"
            label={`${label} (${Object.keys(contents).length})`}
            headerExtra={
                <>
                    <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => {
                            const finalName = prompt("Folder name:");
                            if (!finalName) return;

                            const newPath = path
                                ? `${path}/contents/${finalName}`
                                : finalName;

                            data.updateField(newPath, {
                                type: "folder",
                                contents: {},
                            });
                        }}
                    >
                        <FontAwesomeIcon icon={faFolderPlus} />
                    </Button>

                    <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => {
                            const finalName = prompt("String name:");
                            if (!finalName) return;

                            const newPath = path
                                ? `${path}/contents/${finalName}`
                                : finalName;

                            data.updateField(newPath, {
                                type: "string",
                                contents: "",
                            });
                        }}
                    >
                        <FontAwesomeIcon icon={faFileCirclePlus} />
                    </Button>

                    {path && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                                data.updateField(path, undefined);
                            }}
                        >
                            <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                    )}
                </>
            }
        >
            {/* 👇 Each level needs its own Accordion */}
            <Accordion style={{ marginLeft: "20px" }}>
                {Object.entries(contents).map(([key, value]: [string, any]) => {
                    const currentPath = path ? `${path}/contents/${key}` : key;

                    if (value.type === "folder") {
                        return (
                            <PromptFolder
                                key={currentPath}
                                path={currentPath}
                                label={key}
                            />
                        );
                    }

                    return null;
                })}

                {Object.entries(contents).map(([key, value]: [string, any]) => {
                    const currentPath = path ? `${path}/contents/${key}` : key;

                    if (value.type === "string") {
                        return (
                            <EditableJsonTextField
                                key={currentPath}
                                localJson={data}
                                field={`${currentPath}/contents`}
                                collapsed={true}
                                headerExtra={
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                data.updateField(currentPath, undefined);
                                            }}
                                        >
                                            delete
                                        </Button>
                                        <PromptDropdownButton />
                                    </>
                                }
                            />
                        );
                    }

                    return null;
                })}


            </Accordion>
        </CollapsibleAccordionCard>
    </div>
    );
});