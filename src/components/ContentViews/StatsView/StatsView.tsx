import React from "react";
import TabsContainer from "../../TabsContainer";
import { UsageStatsTable } from "./Helpers/UsageStatsTable/UsageStatsTable";
import { ProjectStatsComponent } from "./Helpers/ProjectStats/ProjectStatsComponent";
import { Button } from "react-bootstrap";
import { getFromWorker } from "../../../classes/CloudflareWorker/WorkerUtils";
import { TotalUserStatsComponent } from "./Helpers/UserStats/UserStats";


export const StatsView: React.FC = () => {
  return (
    <>

      <TabsContainer
        tabs={{
          Weekly_Stats: (
            <>
              <UsageStatsTable />
            </>
          ),
          Project_Stats: <>
            <ProjectStatsComponent />
          </>,
          User_Stats: <>
            <TotalUserStatsComponent />
          </>,
          Storage_Data: <>
            <Button
              size="sm"
              onClick={async () => {
                const response = await getFromWorker("files/folders");
                console.log(response);
              }}
            >Check R2</Button>


          </>,
        }}
      />
    </>
  );
};