import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { SettingsView } from "./SettingsView";
import { ScriptView } from "./ScriptView";
import { ArtbookView } from "./Artbook/ArtbookView";
import TaskView from "./TaskView";
import {  Button } from "react-bootstrap";
import { SceneView } from "./SceneView";

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
      return <SceneView scene={project.selectedScene}/>;
    case "taskview":
      return <TaskView project={project} />;


    default:
      return <Button onClick={() => console.log("Project:",project)}>LOG</Button>;
  }
});
