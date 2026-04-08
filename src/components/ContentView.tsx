import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { SettingsView } from "./SettingsView";
import { ScriptView } from "./ScriptView";
import { ArtbookView } from "./Artbook/ArtbookView";
import TaskView from "./TaskView";
import { Button } from "react-bootstrap";
import { SceneView } from "./SceneView";
import { Character } from "../classes/Artbook/Character";
import { ArtbookCharacterView } from "./Artbook/ArtboookCharacterView";
import { PromptView } from "./PromptView";
import { ScriptMasterView } from "./ScriptMaster/ScriptMasterView";

interface ContentViewProps {
  project: Project | null;
}

export const ContentView: React.FC<ContentViewProps> = observer(({ project }) => {
  if (!project) return null;

  switch (project.currentView.type) {
    case "settings":
      return <SettingsView project={project} />;
    case "script":
      return <ScriptView project={project} />;
    case "artbook":
      return project.artbook ? (
        <ArtbookView artbook={project.artbook} />
      ) : (
        <div>No Artbook found.</div>
      );
    case "scene":
      if (!project.selectedScene) return null;
      return <SceneView scene={project.selectedScene} />;
    case "taskview":
      return <TaskView project={project} />;
    case "charview":
      const selected_char = project.getByAbsPath(project.selectedPath, Character);
      if (selected_char)
        return <>
          <h2 className="mb-3">
            <span
              style={{
                color: "rgba(161, 161, 161, 0.6)", // makes it less bright / lighter
                fontSize: "0.75em",       // slightly smaller than the main text
                fontWeight: 400,          // optional: lighter weight
              }}
            >
              {selected_char.parentFolder!.name} {" : "}
            </span>
            {selected_char.name} {/* main character name stays normal */}
          </h2>
          <ArtbookCharacterView character={selected_char} />
        </>
      else
        return <>"Selected Item IS not A charactrer"</>
    case "promptview":
      return <PromptView />
    case "scriptmaster":
      return <ScriptMasterView />



    default:
      return <Button onClick={() => console.log("Project:", project)}>LOG</Button>;
  }
});
