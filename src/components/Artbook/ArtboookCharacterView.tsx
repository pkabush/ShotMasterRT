import { observer } from "mobx-react-lite";
import type { MediaFolder } from "../../classes/MediaFolder";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Accordion, Badge, Button, Card, CardGroup, CloseButton, Col, Container, Image, Navbar, Row, Spinner, Stack } from "react-bootstrap";
import type { LocalImage } from "../../classes/fileSystem/LocalImage";
import { useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { Character } from "../../classes/Artbook/Character";
import EditableJsonTextField from "../EditableJsonTextField";
import DropArea from "../Atomic/DropArea";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect } from "../WorkflowOptionSelect";
import { useProject } from "../../contexts/ProjectContext";
import { GoogleAI } from "../../classes/GoogleAI";
import { MediaFolderGallery } from "../MediaFolderGallery";
import { AddVariationCard, CharVariationView } from "./CharVariationView";


interface ArtbookCharacterViewProps {
    character: Character;
}

export const ArtbookCharacterView: React.FC<ArtbookCharacterViewProps> = observer(({ character }) => {
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null)
    const { project } = useProject();

    return (
        <Accordion.Item eventKey={character.path} key={character.path} >
            <Accordion.Header>{character.name}            </Accordion.Header>
            <Accordion.Body>
                {false && <>
                    <Button variant="primary" onClick={() => { character.log() }} >LOG</Button>
                    <Button variant="primary" onClick={() => { character.addVariation() }} >Add Variation</Button>
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
                    <AddVariationCard character={character} />

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




