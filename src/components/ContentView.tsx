import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { SettingsView } from "./SettingsView";
import { ScriptView } from "./ScriptView";
import { ArtbookView } from "./ArtbookView";
import TabsContainer from "./TabsContainer";
import SceneInfoCard from "./SceneInfoCard";
import ShotsInfoStrip from "./ShotsInfoStrip";
import TaskView from "./TaskView";

interface ContentViewProps {
  project: Project | null;
}

export const ContentView: React.FC<ContentViewProps> = observer(({ project }) => {  
  if(!project) return null;
  
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
          <h2>{scene.name}</h2>
          <TabsContainer
            tabs={{
              Scene: <SceneInfoCard scene={scene} />,
              Shots: <ShotsInfoStrip scene={scene} />,
            }}
          />
        </div>
      );
    case "taskview":
      return  <TaskView project={project} />;


    default:
      return null;
  }
});
