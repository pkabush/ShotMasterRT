import { observer } from "mobx-react-lite";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Button, Card, CardGroup, Col, Row, Stack, } from "react-bootstrap";
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
        <>
            {true && <>
                {false &&
                    <Stack direction="horizontal" gap={0} className="mb-2">
                        <Button variant="success" size="sm" onClick={() => { character.addVariation() }} >Add Variation</Button>
                        <Button variant="outline-secondary" size="sm" className="ms-auto" onClick={() => { character.log() }} >LOG</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => { character.delete() }} >DELETE</Button>
                    </Stack>}
                <GenVariations character={character} />
            </>
            }

            <CardGroup>
                {Object.keys(character.variations).map((variationName, index) => (
                    // CHARACTER CARD
                    <Col xs={6} md={3} lg={1} key={index}>
                        <Card
                            onClick={() => setSelectedVariation(variationName)}
                            style={{ cursor: "pointer" }} // 👈 fixed width
                            bg={selectedVariation == variationName ? "success" : ""}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "150px",
                                    overflow: "hidden",
                                    position: "relative",
                                }}
                            >
                                {character.getVariationImage(variationName) ? (
                                    <MediaPreview
                                        media={character.getVariationImage(variationName)}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover", // 🔥 key line (crop instead of stretch)
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "black",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "grey",
                                            fontSize: "1rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        NO IMAGE
                                    </div>
                                )}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0, // ensures text never exceeds image width
                                        backgroundColor: "rgba(0,0,0,0.5)",
                                        color: "white",
                                        fontSize: "0.95rem",
                                        padding: "2px 6px",
                                        overflowWrap: "break-word", // allows wrapping inside width
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {variationName}
                                </div>

                            </div>

                        </Card>
                    </Col>
                ))}

                {/** ADD CARD */}
                {false && <AddVariationCard character={character} />}

                <Col xs={6} md={3} lg={1} key={"ADD"}>
                    <Card
                        onClick={() => { character.addVariation() }}
                        style={{ cursor: "pointer" }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "150px",
                                overflow: "hidden",
                                position: "relative",
                            }}
                        >

                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "grey",
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                    border: "3px solid #29618f",
                                    backgroundColor: "#1a2c38",
                                    borderRadius: "8px",
                                }}
                            >
                                +Add Variation
                            </div>


                        </div>

                    </Card>
                </Col>

            </CardGroup>



            {selectedVariation && (selectedVariation in character.variations) &&
                <>
                    <Card >
                        <Card.Body >
                            <Row>
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

                            <MediaFolderGallery mediaFolder={character.MediaFolder_results} defaultCollapsed={true} />
                        </Card.Body>
                    </Card>


                </>
            }

        </>
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

                        if (res) {
                            const clean = res.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                            character.charJson!.updateField(charlist_field, clean)
                        }

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
                            character.addVariation(look_name.replace(" ", "_"), look_descrition)
                        }


                    }}>Add Looks</Button>
                </>
            }
        />



    </div>;
});

