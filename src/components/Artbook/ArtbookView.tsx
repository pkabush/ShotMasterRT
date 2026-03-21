// ArtbookView.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button } from "react-bootstrap";
import TabsContainer from "../TabsContainer";
import { Artbook } from "../../classes/Artbook";
import { ArtbookCharacterView } from "./ArtboookCharacterView";
import { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { Character } from "../../classes/Artbook/Character";



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
              onSelect={() => {
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
});
