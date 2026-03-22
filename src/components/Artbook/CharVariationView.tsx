import { observer } from "mobx-react-lite";
import { Badge, Button, Card, CloseButton, Col, Stack } from "react-bootstrap";
import EditableJsonTextField from "../EditableJsonTextField";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import { GoogleAI } from "../../classes/GoogleAI";
import { useProject } from "../../contexts/ProjectContext";
import type { Character } from "../../classes/Artbook/Character";
import DropArea from "../Atomic/DropArea";
import { TagsFolderContainer } from "../FolderTags/FolderTagsVide";

interface CharVariationViewProps {
    character: Character;
    variationName: string;
    onClose: () => void;
}

export const CharVariationView: React.FC<CharVariationViewProps> = observer(({
    character,
    variationName,
    onClose
}) => {
    const { project } = useProject();

    return (
        <div className="mx-2">
            <Stack direction="horizontal" gap={3}>
                <h2>
                    <Badge bg="secondary">{variationName}</Badge>
                </h2>

                <Button
                    onClick={() => character.deleteVariation(variationName)}
                    className="ms-auto"
                    variant="danger"
                    size="sm"
                >
                    DELETE
                </Button>

                <CloseButton onClick={onClose} />
            </Stack>

            <EditableJsonTextField
                localJson={character.charJson}
                field={`variations/${variationName}/prompt`}
            />

            <TagsFolderContainer tags={character.references} folders={[character]} />

            <SettingsButton
                className="mb-2"
                buttons={
                    <>
                        <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => character.generateLook(variationName)}
                        >
                            Generate Image
                        </button>

                        <WorkflowOptionSelect
                            workflowName={character.workflows.generate_variation_image}
                            optionName="model"
                            values={Object.values(GoogleAI.options.img_models)}
                        />

                        <WorkflowOptionSelect
                            workflowName={character.workflows.generate_variation_image}
                            optionName="aspect_ratio"
                            values={Object.values(GoogleAI.options.aspect_ratios)}
                            defaultValue={GoogleAI.options.aspect_ratios.r16x9}
                        />                        

                        <LoadingSpinner
                            isLoading={character.generating_variations.includes(variationName)}
                            asButton
                        />
                    </>
                }
                content={
                    <>
                        <EditableJsonTextField
                            localJson={project!.projinfo}
                            field={`workflows/${character.workflows.generate_variation_image}/prompt`}
                            fitHeight
                        />
                    </>
                }
            />

            <Button
                onClick={() => character.setVariationImage(variationName)}
                variant="primary"
                size="sm"
            >
                USE Picked Image
            </Button>
        </div>
    );
});



interface AddVariationCardProps {
    character: Character;
}

export const AddVariationCard: React.FC<AddVariationCardProps> = ({ character }) => {
    return (
        <Col xs={8} md={3} lg={2} style={{ marginBottom: "1rem" }}>
            <Card
                style={{ cursor: "pointer" }}
            >
                <DropArea
                    height={'100px'}
                    width={"100%"}
                    onDrop={(files) => {
                        console.log("test", files);
                        // future: character.addVariationFromFiles(files)
                    }}
                />

                <Card.Body>
                    <Stack direction="horizontal" gap={1}>
                        <Button variant="success" onClick={() => character.addVariation()}>
                            Add Look
                        </Button>

                        {false && (<>
                            <Button
                                variant="outline-secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    character.log();
                                }}
                            >
                                LOG
                            </Button>

                            <Button
                                variant="danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    character.log();
                                }}
                            >
                                Delete
                            </Button>
                        </>
                        )}

                    </Stack>
                </Card.Body>
            </Card>
        </Col>
    );
};