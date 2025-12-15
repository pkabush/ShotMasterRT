import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { StringEditField } from "./StringEditField";
import SimpleButton from "./SimpleButton";

interface SettingsViewProps {
  project: Project;
}

export const SettingsView: React.FC<SettingsViewProps> = observer(({ project }) => {
  const { userSettingsDB } = project;

  if (!userSettingsDB) return null;

  return (
    <div style={{ maxWidth: 400, padding: 20 }}>
      <h3>API Keys</h3>

      <StringEditField
        label="GPT API Key"
        value={userSettingsDB.data.api_keys.GPT_API_KEY || ""}
        onChange={async (newValue) => {
          await userSettingsDB.update(data => { data.api_keys.GPT_API_KEY = newValue; });
        }}
      />

      <StringEditField
        label="Google API Key"
        value={userSettingsDB.data.api_keys.Google_API_KEY || ""}
        onChange={async (newValue) => {
          await userSettingsDB.update(data => { data.api_keys.Google_API_KEY = newValue; });
        }}
      />

      <SimpleButton onClick={ ()=> {project.log()}} label="LOG" />
    </div>
  );
});
