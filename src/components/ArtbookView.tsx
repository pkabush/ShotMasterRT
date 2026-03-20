// ArtbookView.tsx
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Row, Col, Card, Spinner, Accordion, Button } from "react-bootstrap";
import TabsContainer from "./TabsContainer";
import { Artbook } from "../classes/Artbook";
import { Art } from "../classes/Art";
import ArtInfoCard from "./ArtInfoCard";
import { ArtbookCharacterView } from "./Artbook/ArtboookCharacterView";
import { LocalFolder } from "../classes/fileSystem/LocalFolder";
import { MediaFolder } from "../classes/MediaFolder";
import SimpleButton from "./Atomic/SimpleButton";
import { Character } from "../classes/Artbook/Character";




interface ArtbookViewProps {
  artbook: Artbook;
}

export const ArtbookView: React.FC<ArtbookViewProps> = observer(({ artbook }) => {

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="mb-3">Artbook</h2>
      <TabsContainer
        tabs={Object.fromEntries(artbook.getType(LocalFolder).map(child => [
          child.name,
          <>
            <Button variant="primary" onClick={() => {
              console.log("Add char")
              artbook.createCharacter(child);
            }} >Add Character</Button>


            <Accordion alwaysOpen={false}
              //defaultActiveKey={child.getType(MediaFolder).map(c => c.path)}
              onSelect={(key) => {
                for (const char of child.getType(Character)) {
                    char.MediaFolder_results?.setSelectedMedia(null);
                }
              }}
            >
              {child.getType(Character).map(character => (
                <ArtbookCharacterView character={character} key={character.path} />
              ))}
            </Accordion>
          </>
        ])
        )}
      />
    </div>
  );

  // OLD CODE

  const [openArt, setOpenArt] = useState<Art | null>(null);

  if (!Object.keys(artbook.data).length) {
    return <div>No Artbook content found.</div>;
  }

  // Thumbnail component with its own loading state
  const ArtThumbnail: React.FC<{ art: Art }> = ({ art }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      art.image.getUrlObject().then((u) => {
        if (mounted) setUrl(u);
      });
      return () => {
        mounted = false;
      };
    }, [art]);

    return (
      <Col xs={6} md={3} lg={2} style={{ marginBottom: "1rem" }}>
        <Card onClick={() => setOpenArt(art)} style={{ cursor: "pointer" }}>
          {url ? (
            <Card.Img variant="top" src={url} />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Spinner animation="border" />
            </div>
          )}
          <Card.Body>
            <Card.Text style={{ fontSize: "0.8rem" }}>{art.handle.name}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const createArtItemContainer = (itemName: string, arts: Art[]) => {
    return (
      <div key={itemName} style={{ marginBottom: "2rem" }}>
        <h5>{itemName}</h5>

        {/* Thumbnails always visible */}
        <Row>
          {arts.map((art) => (
            <ArtThumbnail art={art} key={art.handle.name} />
          ))}
        </Row>

        {/* Selected ArtInfoCard below thumbnails */}
        {openArt && arts.includes(openArt) && (
          <div style={{ marginTop: "1rem" }}>
            <ArtInfoCard art={openArt} onClose={() => setOpenArt(null)} />
          </div>
        )}
      </div>
    );
  };

  const createArtTab = (items: Record<string, Art[]>) => {
    return (
      <div style={{ padding: "1rem" }}>
        {Object.entries(items).map(([itemName, arts]) =>
          createArtItemContainer(itemName, arts)
        )}

        {/* Spacer at the bottom to prevent page jump when opening ArtInfoCard */}
        <div style={{ height: "500px" }} />
      </div>
    );
  };

  const tabs: Record<string, React.ReactNode> = {};
  for (const typeName in artbook.data) {
    tabs[typeName] = createArtTab(artbook.data[typeName]);
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="mb-3">Artbook</h2>
      <TabsContainer tabs={tabs} />
    </div>
  );
});
