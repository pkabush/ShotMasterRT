import { observer } from "mobx-react-lite";
import type { Scene } from "../classes/Scene";
import { Badge, Button, Stack } from "react-bootstrap";
import SimpleButton from "./Atomic/SimpleButton";
import TabsContainer from "./TabsContainer";
import SceneInfoCard from "./SceneInfoCard";
import ShotsInfoStrip from "./ShotsInfoStrip";
import { SceneTimelineView } from "./SceneViews/TimelineView";
import { SceneNodeBuilderWithProvider } from "./NodeMaster/ShotNodeBuilder";
import { useState } from "react";
import ResizableContainer from "./ResizableContainer";
import ShotStripPreview from "./ShotStripPreview";


export interface SceneViewProps {
    scene: Scene;
}


export const SceneView: React.FC<SceneViewProps> = observer(({ scene }) => {
    return <div>
        <Stack direction="horizontal">
            <h2><Badge bg="secondary">{scene.name}</Badge></h2>
            {false && <>
                <SimpleButton onClick={() => { scene.delete() }} label="Delete Scene" className="btn-outline-danger ms-auto" />
                <SimpleButton onClick={() => scene.log()} label="LOG" />
            </>
            }
        </Stack>

        <TabsContainer
            tabs={{
                Scene: <SceneInfoCard scene={scene} />,
                Shots: <ShotsInfoStrip scene={scene} />,
                Timeline: <SceneTimelineView scene={scene} />,
                NodeMaster: <SceneNodegraphSelect scene={scene} />
            }}
        />
    </div>;
});


const SceneNodegraphSelect = observer(({ scene }: SceneViewProps) => {
    const [showShotsPanel, setShowShotsPanel] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Overlay button */}

            <div
                style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    zIndex: 1000,
                    background: "black"
                }}
            >
                {/* Resizable strip for shot previews */}
                {showShotsPanel ? <ResizableContainer initialHeight={115}>
                    <div className="d-flex overflow-auto gap-2 h-100">
                        {scene.shots_ordered.map((shot) => (
                            <ShotStripPreview
                                key={shot.name}
                                shot={shot}
                                isSelected={scene.selectedShot === shot}
                                onClick={() => { scene.selectShot(shot) }}
                            />
                        ))}

                        <div className="mt-2 overflow-auto">
                            <Stack gap={0}>
                                <SimpleButton label="Hide" onClick={() => { setShowShotsPanel(false) }} />
                                <SimpleButton label="+ Add Shot" onClick={async (e: any) => {
                                    if (e.ctrlKey) {
                                        const newShot = await scene.createShot();
                                        if (newShot) { scene.selectShot(newShot) }
                                    }
                                    else {
                                        const shotName = prompt("Enter new shot name:");
                                        if (!shotName) return;
                                        const newShot = await scene.createShot(shotName);
                                        if (newShot) { scene.selectShot(newShot) }
                                    }
                                }} />
                                <SimpleButton label="Scene" onClick={() => { scene.selectShot(null) }} />
                                
                            </Stack>
                        </div>
                    </div>
                </ResizableContainer>
                    :
                    <Button size="sm" variant="secondary" onClick={() => { setShowShotsPanel(true) }} >ShotStrip </Button>
                }

            </div>

            {/* Scene builder */}
            <SceneNodeBuilderWithProvider
                nodegraphJson={scene.selectedShot ? scene.selectedShot.nodeGraphJson! : scene.nodeGraphJson!}
            />
        </div>
    );
});