import { observer } from "mobx-react-lite";
import type { Scene } from "../classes/Scene";
import { Badge, Stack } from "react-bootstrap";
import SimpleButton from "./Atomic/SimpleButton";
import TabsContainer from "./TabsContainer";
import SceneInfoCard from "./SceneInfoCard";
import ShotsInfoStrip from "./ShotsInfoStrip";
import { StoryboardView } from "./Scene/StoryboardView";


interface SceneViewProps {
    scene: Scene ;
}


export const SceneView: React.FC<SceneViewProps> = observer(({ scene }) => {
    return <div>
        <Stack direction="horizontal">
            <h2><Badge bg="secondary">{scene.name}</Badge></h2>
            <SimpleButton onClick={() => { scene.delete() }} label="Delete Scene" className="btn-outline-danger ms-auto" />
            <SimpleButton onClick={() => scene.log()} label="LOG" />
        </Stack>

        <TabsContainer
            tabs={{
                Scene: <SceneInfoCard scene={scene} />,
                Shots: <ShotsInfoStrip scene={scene} />,
                Storyboard: <StoryboardView storyboard={scene.storyboard}/>,
            }}
        />
    </div>;
});