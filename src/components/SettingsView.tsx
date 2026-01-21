import React from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { StringEditField } from "./StringEditField";
import SimpleButton from "./Atomic/SimpleButton.tsx";
import EditableJsonTextField from './EditableJsonTextField';
import TabsContainer from "./TabsContainer";
import SimpleDropdown from './Atomic/SimpleDropdown.tsx';
import * as GPT from "../classes/ChatGPT.ts";

interface SettingsViewProps {
  project: Project;
}

export const SettingsView: React.FC<SettingsViewProps> = observer(({ project }) => {
  const { userSettingsDB } = project;

  if (!userSettingsDB) return null;
  
  const tabs = project.projinfo
    ? {
        "Разбив на Шоты": (<EditableJsonTextField localJson={project.projinfo} field="split_shot_prompt" fitHeight/>),
        "Генерация Тэгов": (<EditableJsonTextField localJson={project.projinfo} field="generate_tags_prompt" fitHeight/>),
      }
    : {};

  

  return (
    <div style={{ padding: 20 }}>
      <h3>API Keys</h3>
      <SimpleButton onClick={ ()=> {project.log()}} label="LOG Project" />  
      <SimpleButton onClick={ ()=> {project.download_asset("assets/server.exe","server.exe")}} label="Download Server" />  

      <EditableJsonTextField localJson={project.projinfo} field="project_path" fitHeight/>

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



    <div>
      <SimpleDropdown
        items={GPT.models}
        currentItem={project.projinfo?.data.gpt_model}
        onPicked={(val)=>{ project.projinfo?.updateField("gpt_model",val); }}
      />
    </div>


      {/* Tabs */}
      <h2>Prompts</h2>
      {Object.keys(tabs).length > 0 && <TabsContainer tabs={tabs} />}


    </div>
  );
});
