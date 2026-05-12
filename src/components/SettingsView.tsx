import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { StringEditField } from "./StringEditField";
import SimpleButton from "./Atomic/SimpleButton.tsx";
import EditableJsonTextField from './EditableJsonTextField';

interface SettingsViewProps {
  project: Project;
}

export const SettingsView: React.FC<SettingsViewProps> = observer(({ project }) => {
  const { userSettingsDB } = project;
  if (!userSettingsDB) return null;

  const [showKeys, setShowKeys] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <h3>Settings</h3>
      <SimpleButton onClick={() => { project.log() }} label="LOG Project" />
      <SimpleButton onClick={() => { project.download_asset("assets/server.exe", "server.exe") }} label="Download Server (Windows)" />
      <SimpleButton onClick={() => { project.download_asset("assets/server.zip", "server.zip") }} label="Download Server (MacOS)" />

      <EditableJsonTextField localJson={project.projinfo} field="project_path" fitHeight />

      <h4>API Keys</h4>
      <SimpleButton
        onClick={() => setShowKeys(v => !v)}
        label={showKeys ? "Hide API Keys" : "Show API Keys"}
      />
      <div style={{
        filter: showKeys ? "none" : "blur(6px)",
        pointerEvents: showKeys ? "auto" : "none",
        transition: "filter 0.2s ease",
      }}>
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

        <StringEditField
          label="Kling Acess Key"
          value={userSettingsDB.data.api_keys.Kling_Acess_Key || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.Kling_Acess_Key = newValue; });
          }}
        />

        <StringEditField
          label="Kling Secret Key"
          value={userSettingsDB.data.api_keys.Kling_Secret_Key || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.Kling_Secret_Key = newValue; });
          }}
        />

        <StringEditField
          label="Seedance API KEY"
          value={userSettingsDB.data.api_keys.BP_API_KEY || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.BP_API_KEY = newValue; });
          }}
        />
      </div>




    </div>
  );
});
