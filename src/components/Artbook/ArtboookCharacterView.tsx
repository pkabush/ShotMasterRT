import { observer } from "mobx-react-lite";
import type { MediaFolder } from "../../classes/MediaFolder";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Accordion, Button, Card, CardGroup, Col, Image, Row } from "react-bootstrap";
import type { LocalImage } from "../../classes/fileSystem/LocalImage";
import { useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { Character } from "../../classes/Artbook/Character";
import EditableJsonTextField from "../EditableJsonTextField";


interface ArtbookCharacterViewProps {
    character: Character;
}

// <MediaPreview media={value} />

export const ArtbookCharacterView: React.FC<ArtbookCharacterViewProps> = observer(({ character }) => {
    const [selectedImage, setSelectedImage] = useState<LocalImage | null>(null)
    const [selectedVariation, setSelectedVariation] = useState<string | null>(null)

    return (
        <Accordion.Item eventKey={character.path} key={character.path}>
            <Accordion.Header>{character.name}            </Accordion.Header>
            <Accordion.Body>
                {false && <>
                    <Button variant="primary" onClick={() => { console.log(character) }} >LOG</Button>
                    <Button variant="primary" onClick={() => { character.addVariation() }} >Add Variation</Button>
                </>
                }

                <CardGroup>
                    {character.media.map((image, index) => (

                        <Col xs={8} md={3} lg={2} style={{ marginBottom: "1rem" }} key={image.path}>
                            <Card onClick={() => {
                                setSelectedImage(image as LocalImage);
                            }} style={{ cursor: "pointer" }}
                                bg={selectedImage == image ? "success" : ""}
                            >
                                <MediaPreview media={image} />
                                <Card.Body>
                                    <Card.Title>{image.handle.name}</Card.Title>
                                    {false && <Card.Text style={{ fontSize: "0.8rem" }}>{image.handle.name}</Card.Text>}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </CardGroup>

                {selectedImage &&
                    <>
                        <Group orientation="horizontal" style={{ height: "100%" }}>
                            {/* Left panel — image */}
                            <Panel defaultSize={500} minSize={10}>
                                <MediaPreview media={selectedImage} style={{ width: "100%", height: "auto" }} />
                            </Panel>

                            {/* Split / drag handle */}
                            <Separator
                                style={{
                                    cursor: "ew-resize",
                                    backgroundColor: "#8f8f8fff",
                                    width: "10px",
                                }}
                            />

                            {/* Right panel — settings */}
                            <Panel minSize={10}>
                                <Card.Title> {selectedImage.name}</Card.Title>
                            </Panel>
                        </Group>
                    </>
                }


                <CardGroup>
                    {Object.keys(character.variations).map((variationName, index) => (

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

                    <Col xs={8} md={3} lg={2} style={{ marginBottom: "1rem" }} key={"Settings"}>
                        <Card
                            onClick={() => { character.addVariation() }}
                            style={{ cursor: "pointer" }}
                        >
                            <Card.Body>
                                <Card.Title>+Add</Card.Title>
                                <Button variant="primary" onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(character)
                                }} >LOG</Button>

                            </Card.Body>
                        </Card>
                    </Col>


                </CardGroup>



                {selectedVariation &&
                    <>
                        <Group orientation="horizontal" style={{ height: "100%" }}>
                            {/* Left panel — image */}
                            <Panel defaultSize={500} minSize={10}>
                                <MediaPreview media={character.getVariationImage(selectedVariation)} style={{ width: "100%", height: "auto" }} />
                            </Panel>

                            {/* Split / drag handle */}
                            <Separator
                                style={{
                                    cursor: "ew-resize",
                                    backgroundColor: "#8f8f8fff",
                                    width: "10px",
                                }}
                            />

                            {/* Right panel — settings */}
                            <Panel minSize={10}>
                                <div className="mx-2">
                                    <Card.Title className="m-2"> {selectedVariation}</Card.Title>
                                    
                                    <EditableJsonTextField localJson={character.charJson} field={`variations/${selectedVariation}/promt`} />
                                </div>
                            </Panel>
                        </Group>
                    </>
                }




            </Accordion.Body>
        </Accordion.Item>





    );
})




