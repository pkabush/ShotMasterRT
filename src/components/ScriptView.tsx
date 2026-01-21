import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import GenericTextEditor from "./GenericTextEditor";
import TabsContainer from "./TabsContainer";
import SimpleButton from "./Atomic/SimpleButton";

interface ScriptViewProps {
  project: Project;
}

export const ScriptView: React.FC<ScriptViewProps> = observer(({ project }) => {
  if (!project.script) {
    return <div>No script loaded in project.</div>;
  }

  // Full script save handler
  const handleSaveFull = async (newText: string) => {
    project.script!.setText(newText);
    await project.script!.save();
  };

  // Prepare tabs for each scene using sortedSceneKeys
  const sceneTabs: Record<string, React.ReactNode> = {};
  for (const key of project.script!.sortedSceneKeys) {
    sceneTabs[key || "Intro"] = (
      <GenericTextEditor
        label={key || "Intro"}
        initialText={project.script!.scenes.get(key)!}
        onSave={async (newText) => {
          project.script!.setSceneText(key, newText);
          await project.script!.save();
        }}
        fitHeight
      />
    );
  }

  // Button handler to create scenes from script
  const handleCreateScenes = async () => {
    try {
      await project.script!.createScenes();
      alert("Scenes created successfully!");
    } catch (err) {
      console.error("Error creating scenes:", err);
      alert("Failed to create scenes. See console for details.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h4>Script</h4>

      {/* Button to create scenes */}
      <SimpleButton
        label="Create Scenes from Script"
        onClick={handleCreateScenes}
        className="mb-2"
      />

      <TabsContainer
        tabs={{
          "Full Script": (
            <GenericTextEditor
              label="Full Script"
              initialText={project.script.text}
              onSave={handleSaveFull}
              fitHeight
            />
          ),
          Scenes: <TabsContainer tabs={sceneTabs} />,
        }}
      />
    </div>
  );
});
