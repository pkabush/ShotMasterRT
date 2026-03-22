// ArtbookView.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button } from "react-bootstrap";
import TabsContainer from "../TabsContainer";
import { Artbook } from "../../classes/Artbook";
import { ArtbookCharacterView } from "./ArtboookCharacterView";
import { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { Character } from "../../classes/Artbook/Character";
import SettingsButton from "../Atomic/SettingsButton";
import { WorkflowOptionSelect, WorkflowTextField } from "../WorkflowOptionSelect";
import { Project } from "../../classes/Project";
import LoadingSpinner from "../Atomic/LoadingSpinner";
import { AI,  AllTextModels } from "../../classes/AI_provider";
import EditableJsonTextField from "../EditableJsonTextField";



interface ArtbookViewProps {
  artbook: Artbook;
}

export const ArtbookView: React.FC<ArtbookViewProps> = observer(({ artbook }) => {

  return (
    <div style={{ padding: "1rem" }}>
      <h2 className="mb-3">Artbook</h2>
      <TabsContainer
        tabs={{
          ...Object.fromEntries(
            artbook.getType(LocalFolder).map(child => [
              child.name,
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    console.log("Add char");
                    artbook.createCharacter(child);
                  }}
                >
                  Add Character
                </Button>

                <Accordion
                  alwaysOpen={false}
                  onSelect={() => {
                    for (const char of child.getType(Character)) {
                      char.MediaFolder_results?.setSelectedMedia(null);
                    }
                  }}
                >
                  {child.getType(Character).map(character => (
                    <ArtbookCharacterView
                      character={character}
                      key={character.path}
                    />
                  ))}
                </Accordion>
              </>
            ])
          ),

          // 👇 NEW TAB
          Generation: (
            <ArtbookGenView artbook={artbook} />
          )
        }}
      />
    </div>
  );
});


export const ArtbookGenView: React.FC<ArtbookViewProps> = observer(({ artbook }) => {
  const project = Project.getProject()
  const charlist_field = "artbook/charlist"


  return <div>
    <SettingsButton
      className="mb-2"
      buttons={
        <>
          {/* Stylize Image Button */}
          <button className="btn btn-sm btn-outline-success" onClick={async () => {

            const workflow = project.workflows[artbook.workflows.gen_char_names] ?? ""
            console.log("Model", workflow.model);
            const prompt = `
            SCRIPT:
            ${project.script?.text}


            ${workflow.prompt}            
            `

            const res = await AI.GenerateText({
              prompt: prompt,
              model: workflow.model!,
            })

            project.projinfo?.updateField(charlist_field, res)

          }} >
            Generate Character Names
          </button>

          {/* Model Selector */}
          <WorkflowOptionSelect
            workflowName={artbook.workflows.gen_char_names}
            optionName={"model"}
            values={AllTextModels}
          />

          {/* Loading Spinner */}
          <LoadingSpinner isLoading={false} asButton />
        </>
      }
      content={
        <>
          <WorkflowTextField workflowName={artbook.workflows.gen_char_names} optionName={"prompt"} />
          <EditableJsonTextField localJson={project.projinfo} field={charlist_field} />
          <Button onClick={() => {
            project.projinfo?.getField(charlist_field).split("\n").map((char_name:string) => {              
              artbook.createCharacter( artbook.characters_folder!, char_name.replace(" ","_") )


            })

            //artbook.createCharacter()


          }}>Create Characters</Button>
        </>
      }
    />



  </div>;
});


