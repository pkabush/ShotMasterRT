import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Project } from "../classes/Project";
import { StringEditField } from "./StringEditField";
import SimpleButton from "./Atomic/SimpleButton.tsx";
import EditableJsonTextField from './EditableJsonTextField';
import type { Provider } from "../classes/AiProviders/CostTracker.ts";
import { Button, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faCopy } from "@fortawesome/free-solid-svg-icons";

interface SettingsViewProps {
  project: Project;
}

export const SettingsView: React.FC<SettingsViewProps> = observer(({ project }) => {
  const { userSettingsDB } = project;
  if (!userSettingsDB) return null;

  const [showKeys, setShowKeys] = useState(false);

  return (
    <div style={{ padding: 20 }} className="user-select-none">
      <h3>Settings</h3>
      <StringEditField
        label="Username"
        value={userSettingsDB.data.username || ""}
        onChange={async (newValue) => {
          await userSettingsDB.update(data => { data.username = newValue; });
        }}
      />


      <SimpleButton onClick={() => { project.log() }} label="LOG Project" />
      <SimpleButton onClick={() => { project.download_asset("assets/server.exe", "server.exe") }} label="Download Server (Windows)" />
      <SimpleButton onClick={() => { project.download_asset("assets/server.zip", "server.zip") }} label="Download Server (MacOS)" />
      <SimpleButton onClick={() => { project.download_asset("assets/Shotmaster_import.Lua", "Shotmaster_import.Lua") }} label="Download Resolve LuaScript" />

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

        {false && <>
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
        </>}

        <StringEditField
          label="Kling API Key"
          value={userSettingsDB.data.api_keys.Kling_Api_Key || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.Kling_Api_Key = newValue; });
          }}
        />

        <StringEditField
          label="Seedance API KEY"
          value={userSettingsDB.data.api_keys.BP_API_KEY || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.BP_API_KEY = newValue; });
          }}
        />

        <StringEditField
          label="HOPSHOT API KEY"
          value={userSettingsDB.data.api_keys.HOPSHOT_API_KEY || ""}
          onChange={async (newValue) => {
            await userSettingsDB.update(data => { data.api_keys.HOPSHOT_API_KEY = newValue; });
          }}
        />
      </div>

      <>
        To use Lua Script paste it to:
        <br />
        C:\Users\USERNAME\AppData\Roaming\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility
        <br />
        Also you can add shortcut to it - for example "H" is free
      </>

      <Stack direction="horizontal" gap={1}>
        <h4 className="mt-4" onClick={() => {
          project.costTracker?.log();
        }}>Billing</h4>

        <Button onClick={() => {
          project.costTracker?.getUsage(project.userSettingsDB.data.username, project.name);
        }}
          variant="outline-secondary"
          size="sm"
          className="mt-4 d-flex align-items-center justify-content-center"
        >
          <FontAwesomeIcon icon={faCopy} />
        </Button>

        <Button
          variant="outline-secondary"
          size="sm"
          className="mt-4 d-flex align-items-center justify-content-center"
          onClick={async () => {

            if (!project.userSettingsDB.data.username) {
              alert("ERROR: USERNAME is required.");
              return;
            }

            if (!project.userSettingsDB.data.api_keys.HOPSHOT_API_KEY) {
              alert("ERROR: HOPSHOT_APIKEY is required.");
              return;
            }

            const url = "https://script.google.com/macros/s/AKfycbxvqDnrjDmumcLF8M2s2n5Z0vZ4DklqgNGa3ZFXRyAYQhYbiWVSKX-aMEcFC7Wauxprrw/exec";
            const encodedTarget = encodeURIComponent(url);
            const locUrl = `http://localhost:4000/proxy/${encodedTarget}`;

            const usage_json = await project.costTracker?.getUsageJson(project.userSettingsDB.data.username, project.name, project.userSettingsDB.data.api_keys.HOPSHOT_API_KEY);
            const res = await fetch(locUrl, { method: "POST", body: JSON.stringify(usage_json), });

            console.log(res);
            const data = await res.json();
            if (data.success) {
              console.log("%cSUCCESS", "color: green; font-weight: bold;");
            } else {
              console.log("%cERROR: " + data.error, "color: red; font-weight: bold;");
            }


            const audio = new Audio("assets/sounds/cha-ching-money.mp3");
            audio.volume = 0.25;
            audio.currentTime = 0;
            audio.play().catch((err) => { console.error("Failed to play sound:", err); });


          }}
        >
          <FontAwesomeIcon icon={faCloudArrowUp} />
        </Button>

      </Stack>


      <div className="d-flex flex-wrap">
        {[
          { name: "Google", key: "Google" },
          { name: "GPT", key: "GPT" },
          { name: "kling", key: "kling" },
          { name: "bytedance", key: "bytedance" },
        ].map((provider) => {
          const data = project.costTracker?.getProviderData(
            provider.key as Provider
          );

          return (
            <div key={provider.key} className="border rounded px-3 py-2">
              <div className="fw-semibold">{provider.name}</div>

              <div className="small text-muted d-flex gap-2">
                <span className="text-success">  {(data?.totalCost ?? 0).toFixed(2)}$</span>
                <span>{data?.taskCount ?? 0} tasks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

