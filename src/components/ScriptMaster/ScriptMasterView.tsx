import { observer } from "mobx-react-lite";
import { Project } from "../../classes/Project";
import { Accordion, Badge, Button } from "react-bootstrap";
import { ModularScript } from "../../classes/ScriptMaster";
import { CollapsibleAccordionCard, CollapsibleContainerAccordion } from "../Atomic/CollapsibleContainer";
import EditableJsonTextField from "../EditableJsonTextField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCirclePlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import TabsContainer from "../TabsContainer";




export const ScriptMasterView = observer(() => {
    const project = Project.getProject();
    //const data = project.promptinfo;
    //const scriptmaster = project.getType(ScriptMaster)[0];

    const script = project.getByPath(project.selectedPath, ModularScript);

    if (!script) return null;



    return <div style={{ margin: "0px" }}>
        <h2><Badge bg="secondary">{script.name_no_extension}</Badge></h2>

        <TabsContainer tabs={{
            Description: <>
                <EditableJsonTextField localJson={script} field="synopsys" />
                <EditableJsonTextField localJson={script} field="logline" />
            </>,

            Episodes: <>                
                <AddButton onClick={() => { script.addEpisode(); }} />

                <Accordion >
                    {Object.entries(script.episodes).map(([episodeName, episode]) => (
                        <CollapsibleAccordionCard label={episodeName} key={episodeName} headerExtra={
                            <DeleteButton onClick={() => { script.removeEpisode(episodeName); }} />
                        }>
                            <div className="m-3">
                                <EditableJsonTextField localJson={script} field={`episodes/${episodeName}/description`} />

                                <CollapsibleContainerAccordion label="Scenes" headerExtra={
                                    <AddButton onClick={() => { script.addScene(episodeName); }} />
                                }>
                                    <Accordion style={{ marginLeft: "15px" }}>
                                        {Object.entries(episode.scenes ?? {}).map(([sceneName, sceneData]) => (
                                            <CollapsibleAccordionCard label={sceneName} key={sceneName} headerExtra={
                                                <DeleteButton onClick={() => { script.removeScene(episodeName, sceneName); console.log(sceneData); }} />
                                            }>
                                                <EditableJsonTextField localJson={script} field={`episodes/${episodeName}/scenes/${sceneName}/text`} />


                                            </CollapsibleAccordionCard>
                                        ))}
                                    </Accordion>

                                </CollapsibleContainerAccordion>

                            </div>
                        </CollapsibleAccordionCard>
                    ))}
                </Accordion>



            </>
        }} />
    </div>

});




export const DeleteButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <Button size="sm" variant="outline-danger" onClick={onClick}>
            <FontAwesomeIcon icon={faTrashCan} />
        </Button>
    );
};

export const AddButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <Button size="sm" variant="outline-success" onClick={onClick}>
            <FontAwesomeIcon icon={faFileCirclePlus} />
        </Button>
    );
};

