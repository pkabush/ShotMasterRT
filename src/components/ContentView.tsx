import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { SettingsView } from "./SettingsView";
import { ScriptView } from "./ScriptView";
import { ArtbookView } from "./Artbook/ArtbookView";
import TabsContainer from "./TabsContainer";
import SceneInfoCard from "./SceneInfoCard";
import ShotsInfoStrip from "./ShotsInfoStrip";
import TaskView from "./TaskView";
import { Badge, Stack } from "react-bootstrap";
import SimpleButton from "./Atomic/SimpleButton";

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
      const scene = project.selectedScene;
      return (
        <div>
          <Stack direction="horizontal">
            <h2><Badge bg="secondary">{scene.name}</Badge></h2>
            <SimpleButton onClick={() => {scene.delete()}} label="Delete Scene" className="btn-outline-danger ms-auto" />
            <SimpleButton onClick={() => scene.log()} label="LOG" />
          </Stack>

          <TabsContainer
            tabs={{
              Scene: <SceneInfoCard scene={scene} />,
              Shots: <ShotsInfoStrip scene={scene} />,
            }}
          />
        </div>
      );
    case "taskview":
      return <TaskView project={project} />;


    default:
      return null;
  }
});
