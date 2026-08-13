import { observer } from "mobx-react-lite";
import type { Scene } from "../../classes/Scene";
import { Badge, Button, Stack } from "react-bootstrap";
import SimpleButton from "../Atomic/SimpleButton";
import TabsContainer from "../TabsContainer";
import SceneInfoCard from "./SceneInfoCard";
import ShotsInfoStrip from "./Shot/ShotsInfoStrip";

import { SceneNodeBuilderWithProvider } from "../NodeMaster/ShotNodeBuilder";
import { useState } from "react";
import ResizableContainer from "../ResizableContainer";
import ShotStripPreview from "../ShotStripPreview";
import { SceneTimelineView } from "./TimelineView";


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
    const [autoplay, setAutoplay] = useState(true);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%'
        }}>
            {/* Overlay button */}
            {/* Shot strip controls */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
            >
                {showShotsPanel ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "150px",
                            right: 0,
                        }}
                    >
                        <div className="d-flex align-items-start w-100">
                            {/* Resizable shot strip */}
                            <div
                                style={{
                                    flex: "1 1 auto",
                                    minWidth: 0,
                                    overflow: "hidden",
                                    background: "black",
                                }}
                            >
                                <ResizableContainer initialHeight={115}>
                                    <div className="d-flex overflow-auto gap-2 h-100">
                                        {scene.shots_ordered.map((shot) => (
                                            <ShotStripPreview
                                                key={shot.name}
                                                shot={shot}
                                                isSelected={scene.selectedShot === shot}
                                                onClick={() => scene.selectShot(shot)}
                                                autoplay={autoplay}
                                            />
                                        ))}
                                    </div>
                                </ResizableContainer>
                            </div>

                            {/* Fixed button area */}
                            <div
                                className="ms-2"
                                style={{
                                    flex: "0 0 100px",
                                    width: "100px",
                                }}
                            >
                                <Stack gap={0}>
                                    <SimpleButton
                                        label="Hide"
                                        onClick={() => setShowShotsPanel(false)}
                                    />

                                    <SimpleButton
                                        label="+ Add Shot"
                                        onClick={async (e: any) => {
                                            if (e.ctrlKey) {
                                                const newShot = await scene.createShot();
                                                if (newShot) scene.selectShot(newShot);
                                            } else {
                                                const shotName = prompt("Enter new shot name:");
                                                if (!shotName) return;

                                                const newShot =
                                                    await scene.createShot(shotName);

                                                if (newShot) scene.selectShot(newShot);
                                            }
                                        }}
                                    />

                                    <SimpleButton
                                        label="Scene"
                                        onClick={() => scene.selectShot(null)}
                                    />

                                    <Button
                                        size="sm"
                                        variant={
                                            autoplay
                                                ? "success"
                                                : "outline-secondary"
                                        }
                                        onClick={() => setAutoplay(v => !v)}
                                    >
                                        Autoplay
                                    </Button>
                                </Stack>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Collapsed button: top-right */
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                        }}
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowShotsPanel(true)}
                        >
                            ShotStrip
                        </Button>
                    </div>
                )}
            </div>


            {/* Scene builder */}
            <SceneNodeBuilderWithProvider
                nodegraphJson={scene.selectedShot ? scene.selectedShot.nodeGraphJson! : scene.nodeGraphJson!}
            />
        </div>
    );
});