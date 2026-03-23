import { observer } from "mobx-react-lite";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Accordion, Button, Card, CardGroup, Col, Row, Stack, } from "react-bootstrap";
import { useState } from "react";
import type { Character } from "../../classes/Artbook/Character";
import { MediaFolderGallery } from "../MediaFolderGallery";
import { AddVariationCard, CharVariationView } from "./CharVariationView";
import { Project } from "../../classes/Project";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import EditableJsonTextField from "../EditableJsonTextField";
import { AI, AllTextModels } from "../../classes/AI_provider";
import LoadingSpinner from "../Atomic/LoadingSpinner";


interface ArtbookCharacterViewProps {
    character: Character;
}

export const ArtbookCharacterView: React.FC<ArtbookCharacterViewProps> = observer(({ character }) => {
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null)

    return (
        <Accordion.Item eventKey={character.path} key={character.path} >
            <Accordion.Header>{character.name}            </Accordion.Header>
            <Accordion.Body className="pt-2 px-3">
                {true && <>
                    <Stack direction="horizontal" gap={0} className="mb-2">
                        <Button variant="success" size="sm" onClick={() => { character.addVariation() }} >Add Variation</Button>
                        <Button variant="outline-secondary" size="sm" className="ms-auto" onClick={() => { character.log() }} >LOG</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => { character.delete() }} >DELETE</Button>
                    </Stack>
                    <GenVariations character={character} />
                </>
                }

                <CardGroup>
                    {Object.keys(character.variations).map((variationName, index) => (
                        // CHARACTER CARD
                        <Col xs={8} md={3} lg={2} style={{ marginBottom: "1rem" }} key={index}>
                            <Card
                                onClick={() => {
                                    setSelectedVariation(variationName);
                                }}
                                style={{ cursor: "pointer" }}
                                bg={selectedVariation == variationName ? "success" : ""}
                            >
                                {character.getVariationImage(variationName) ?
                                    <MediaPreview media={character.getVariationImage(variationName)} /> :
                                    <div
                                        style={{
                                            height: '100px',
                                            aspectRatio: '9 / 16',
                                            backgroundColor: 'black',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'grey',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                        }}
                                    >
                                        NO IMAGE
                                    </div>
                                }
                                <Card.Body>
                                    <Card.Title>{variationName}</Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}

                    {/** ADD CARD */}
                    {false && <AddVariationCard character={character} />}

                </CardGroup>



                {selectedVariation &&
                    <>
                        <Card style={{ height: "100%" }}>
                            <Card.Body style={{ height: "100%" }}>
                                <Row style={{ height: "100%" }}>
                                    {/* Left panel — image (top-aligned) */}
                                    <Col
                                        md={5}
                                        style={{
                                            height: "100%",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "300px",
                                                width: "100%",
                                            }}
                                        >
                                            <MediaPreview
                                                media={character.getVariationImage(selectedVariation)}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        </div>
                                    </Col>

                                    {/* Right panel — settings */}
                                    <Col
                                        md={7}
                                        style={{
                                            height: "100%",
                                            overflowY: "auto",
                                        }}
                                    >
                                        <CharVariationView
                                            character={character}
                                            variationName={selectedVariation}
                                            onClose={() => setSelectedVariation(null)}
                                        />
                                    </Col>

                                </Row>

                                <MediaFolderGallery mediaFolder={character.MediaFolder_results} />
                            </Card.Body>
                        </Card>


                    </>
                }

            </Accordion.Body>
        </Accordion.Item >
    );
})




interface GenVariationsProps {
    character: Character;
}


export const GenVariations: React.FC<GenVariationsProps> = observer(({ character }) => {
    const project = Project.getProject()
    const charlist_field = "looklist"
    const is_env = character.parentFolder?.name == "ЛОКАЦИИ" 
    const wf_name = is_env ? character.workflows.generate_location_data : character.workflows.generate_variation_data


    return <div>
        <SettingsButton
            className="mb-2"
            buttons={
                <>
                    {/* Stylize Image Button */}
                    <button className="btn btn-sm btn-outline-success" onClick={async () => {
                        const workflow = project.workflows[wf_name] ?? ""
                        const prompt = `
            SCRIPT:
            ${project.script?.text}


            ${workflow.prompt} 
            ${character.name}
            `

                        const res = await AI.GenerateText({
                            prompt: prompt,
                            model: workflow.model!,
                        })

                        character.charJson!.updateField(charlist_field, res)

                    }} >
                        Generate Character Looks Json
                    </button>

                    {/* Model Selector */}
                    <WorkflowOptionSelect
                        workflowName={wf_name}
                        optionName={"model"}
                        values={AllTextModels}
                    />

                    {/* Loading Spinner */}
                    <LoadingSpinner isLoading={false} asButton />
                </>
            }
            content={
                <>
                    <WorkflowTextField workflowName={wf_name} optionName={"prompt"} />
                    <EditableJsonTextField localJson={character.charJson} field={charlist_field} />
                    <Button onClick={() => {
                        const looks_json = character.charJson!.getField(charlist_field)

                        let looks_data: Record<string, any>;
                        try {
                            looks_data = JSON.parse(looks_json);
                        } catch (err) {
                            console.error("Invalid shots JSON:", err);
                            alert("Error: The shots JSON is invalid. Please check the format.");
                            return;
                        }

                        for (const look_name of Object.keys(looks_data)) {                            
                            const look_descrition = looks_data[look_name];
                            character.addVariation(look_name.replace(" ","_"),look_descrition )
                        }


                    }}>Add Looks</Button>
                </>
            }
        />



    </div>;
});

