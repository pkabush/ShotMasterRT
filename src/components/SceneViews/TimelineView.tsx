import { observer } from "mobx-react-lite";
import type { SceneViewProps } from "../SceneView";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { useEffect, useMemo, useRef, useState } from "react";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Badge } from "react-bootstrap";

export const SceneTimelineView: React.FC<SceneViewProps> = observer(({ scene }) => {

    useEffect(() => {
        scene.shots.forEach(s => {
            const media = s.previewMedia;
            if (media instanceof LocalVideo) {
                media.ensureDurationLoaded();
            }
        });
    }, [scene]);

    return <>
        <VideoPlaylist scene={scene} />
    </>
});



const VideoPlaylist: React.FC<SceneViewProps> = observer(({ scene }) => {

    const [currentIndex, setCurrentIndex] = useState(0);
    const [clipTime, setClipTime] = useState(0);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const pendingSeekRef = useRef<number | null>(null);

    // Reset on scene Change
    useEffect(() => {
        setCurrentIndex(0);
        setClipTime(0);
        pendingSeekRef.current = null;
        advancedClipRef.current = false;
    }, [scene]);

    const clips = useMemo(() => {
        return scene.shots.map(shot => ({
            video: shot.outVideo,
            shot,
        }));
    }, [scene.shots]);

    const totalDuration = useMemo(() => scene.shots.reduce((sum, s) => sum + (s.previewMedia?.duration ?? 2), 0), [scene.shots]);

    // handle switching clips
    useEffect(() => {
        const currentVideo = videoRefs.current[currentIndex];
        if (!currentVideo) return;

        // pause all others
        videoRefs.current.forEach((v, i) => {
            if (!v) return;
            if (i !== currentIndex) {
                v.pause(); v.currentTime = 0;
            }
        });

        const seek = pendingSeekRef.current;
        pendingSeekRef.current = null;

        const play = async () => {
            if (!currentVideo.src) {
                //currentVideo.src = clips[currentIndex].video?.urlObject ?? "";
                currentVideo.src = "https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3"
                currentVideo.volume = 0.01;

                const preview = clips[currentIndex].shot.previewMedia
                if (preview) {
                    if (preview instanceof LocalVideo)
                        currentVideo.src = preview.urlObject ?? "";
                    else {
                        currentVideo.poster = preview.urlObject ?? "";
                    }
                }

                currentVideo.load();
            }

            await new Promise<void>((resolve) => {
                if (currentVideo.readyState >= 1) return resolve();
                currentVideo.onloadedmetadata = () => resolve();
            });

            currentVideo.currentTime = seek ?? 0;
            currentVideo.play();
        };

        play();
    }, [currentIndex]);

    const currentIndexRef = useRef(currentIndex);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    // Tick
    const advancedClipRef = useRef(false);
    useEffect(() => {
        let raf: number;

        const loop = () => {
            const video = videoRefs.current[currentIndexRef.current];
            const clip = clips[currentIndexRef.current];
            const shot = clip.shot
            const duration = shot.previewMedia?.duration ?? 2

            if (video && clip) {
                const time = video.currentTime;

                // Advance
                if (time >= (Math.min(duration, video.duration)) && !advancedClipRef.current) {
                    advancedClipRef.current = true;

                    setCurrentIndex(prev => {
                        const next = prev + 1 < clips.length ? prev + 1 : 0;
                        return next;
                    });
                    setClipTime(0.0);
                }

                // reset lock when inside clip again
                if (time < (Math.min(duration, video.duration))) {
                    advancedClipRef.current = false;
                    setClipTime(time);
                }
            }

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [scene, clips]);

    const elapsedBefore = clips.slice(0, currentIndex).reduce((sum, c) => sum + (c.shot.previewMedia?.duration ?? 2), 0);
    const globalTime = elapsedBefore + clipTime;
    const globalPercent = (globalTime / totalDuration) * 100;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 🎬 Video Stack */}
            <div style={{ position: "relative", width: "100%", height: 700 }}>
                {clips.map((clip, i) => (
                    <>
                        <video
                            key={clip.shot.path}
                            ref={(el) => { videoRefs.current[i] = el; }}
                            src={clip?.video?.urlObject ?? ""}
                            preload="auto"
                            poster={clip.shot.srcImage?.urlObject ?? ""}
                            controls={true}
                            //onEnded={handleEnded}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: i === currentIndex ? "block" : "none",
                            }}
                        />
                    </>
                ))}

                <span style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                }}>
                    <h3>
                        <Badge bg="secondary">{clips[currentIndex] ? clips[currentIndex].shot.name : "No"}</Badge>
                    </h3>
                </span>
            </div>

            {/* 🎞 Timeline */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    height: 150,
                    width: "100%",
                    background: "#222",
                }}
            //onClick={seekToTime}
            >
                {clips.map((clip, index) => {
                    const video = videoRefs.current[index];
                    const shot = clips[index].shot;
                    const duration = shot.previewMedia?.duration ?? 2;
                    const widthPercent = (duration / totalDuration) * 100;

                    return (
                        <div
                            key={clip.shot.path}
                            style={{
                                width: `${widthPercent}%`,
                                height: "100%",
                                background: index === currentIndex ? "#4ade80" : "#2d2d2d",
                                border: `3px solid ${index == currentIndex ? "#4ade80" : "#626262"}`,
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                            }}


                            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                //console.log("Clicked",video, videoRefs.current,clips);
                                if (!video) return;
                                // SEEK CLICKED CLIP
                                const rect = e.currentTarget.getBoundingClientRect();
                                const ratio = (e.clientX - rect.left) / rect.width;                                
                                const seek_time = ratio * duration;                                

                                // If same index
                                if (index === currentIndex) {
                                    if (video) { video.currentTime = seek_time }
                                    return;
                                }

                                pendingSeekRef.current = seek_time;
                                setCurrentIndex(index);
                            }}


                        >
                            <span style={{
                                position: "absolute",
                                bottom: -2,
                                left: -2,
                            }}>
                                <Badge bg="success">{clip.shot.name}</Badge>
                            </span>

                            <MediaPreview media={clip.shot.previewMedia} height={"100%"} />

                            {/** STYLUS */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    background: "red",
                                    left: `${index === currentIndex ? (clipTime / duration) * 100 : "0"}% `,
                                    pointerEvents: "none",
                                    display: index === currentIndex ? "block" : "none",
                                    //display: "none",
                                }}
                            />
                        </div>
                    );
                })}


                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: "red",
                        left: `${globalPercent}%`,
                        pointerEvents: "none",
                        display: "none"
                    }}
                />


            </div>
        </div>
    );
});