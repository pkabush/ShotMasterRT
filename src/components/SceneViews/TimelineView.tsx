import { observer } from "mobx-react-lite";
import type { SceneViewProps } from "../SceneView";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { useEffect, useMemo, useRef, useState } from "react";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Badge, Button, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackwardFast, faBackwardStep, faPause, faPlay, faRotate, faVolume, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";

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

    const [paused, setPaused] = useState(true)
    const [muted, setMuted] = useState(false)
    const [loop, setLoop] = useState(false)

    const [clipInfo, setClipInfo] = useState<any>(null)

    const [trimStart, setTrimStart] = useState(1);
    const [trimEnd, setTrimEnd] = useState(5);

    // Reset on scene Change
    useEffect(() => {
        setCurrentIndex(0);
        setClipTime(0);
        setPaused(true);
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
            setClipTime(seek ?? 0);
            if (!paused) currentVideo.play();

            //update Clip Indo
            setClipInfo({
                duration: currentVideo.duration
            });
        };

        play();



    }, [currentIndex]);

    const currentIndexRef = useRef(currentIndex);
    const pausedRef = useRef(paused);
    const loopRef = useRef(loop);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { loopRef.current = loop; }, [loop]);

    // Tick
    const advancedClipRef = useRef(false);
    useEffect(() => {
        let raf: number;

        const loop = () => {
            if (!pausedRef.current) {
                const video = videoRefs.current[currentIndexRef.current];
                const clip = clips[currentIndexRef.current];
                const shot = clip.shot
                const duration = shot.previewMedia?.duration ?? 2


                if (video && clip) {
                    const time = video.currentTime;

                    // Advance
                    if (time >= (Math.min(duration, video.duration)) && !advancedClipRef.current) {
                        advancedClipRef.current = true;
                        video.currentTime = 0.0;
                        setClipTime(0.0);

                        if (loopRef.current) {
                            video.play();
                        }
                        else {
                            setCurrentIndex(prev => {
                                const next = prev + 1 < clips.length ? prev + 1 : 0;
                                return next;
                            });
                        }
                    }

                    // reset lock when inside clip again
                    if (time < (Math.min(duration, video.duration))) {
                        advancedClipRef.current = false;
                        setClipTime(time);
                    }
                }
            }

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [scene, clips]);

    // ON Paused
    useEffect(() => {
        const video = videoRefs.current[currentIndexRef.current];
        if (paused) video?.pause();
        else video?.play();
    }, [paused])

    // on Sound switch
    useEffect(() => {
        videoRefs.current.forEach((v, i) => {
            if (!v) return;
            v.muted = muted;
        });
    }, [muted])

    const toClipStart = () => {
        const video = videoRefs.current[currentIndexRef.current];
        if (video) { video.currentTime = 0 }
        setClipTime(0);
    }

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

                    <Stack direction="horizontal" gap={1}>
                        <Button onClick={toClipStart} variant="secondary">
                            <FontAwesomeIcon icon={faBackwardStep} />
                        </Button>
                        <Button onClick={() => { setPaused((prev) => { return !prev; }) }} variant={paused ? "success" : "warning"}>
                            {paused ? <FontAwesomeIcon icon={faPlay} /> : <FontAwesomeIcon icon={faPause} />}
                        </Button>
                        <Button onClick={() => { setLoop((prev) => { return !prev; }) }} variant={loop ? "info" : "outline-secondary"}>
                            <FontAwesomeIcon icon={faRotate} />
                        </Button>
                        <Button onClick={() => { setMuted((prev) => { return !prev; }) }} variant={!muted ? "secondary" : "outline-secondary"}>
                            {!muted ? <FontAwesomeIcon icon={faVolume} /> : <FontAwesomeIcon icon={faVolumeXmark} />}
                        </Button>
                    </Stack>


                    <strong>{clipTime.toFixed(2)} / {clipInfo?.duration.toFixed(2)}</strong>
                    <br />
                    <div style={{ color: '#a1a1a1', fontSize: '14px', fontFamily: 'monospace' }}>
                        total: {clipInfo?.duration}
                        <br />
                        time: {clipTime}
                    </div>

                </span>
            </div>


            {/* 🎚 Video Seek Bar */}
            <div
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span style={{ color: "white", fontSize: 12, minWidth: 50, fontFamily: "monospace", }} >
                    {clipTime.toFixed(2)}
                </span>

                {/* Slider wrapper (IMPORTANT) */}
                <div
                    style={{
                        width: "100%",
                        height: 10,
                        background: "#2a2a2a",
                        position: "relative",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                    onPointerDown={(e) => {
                        const video = videoRefs.current[currentIndex];
                        if (!video) return;

                        const rect = e.currentTarget.getBoundingClientRect();

                        const seekFromEvent = (ev: PointerEvent) => {
                            const ratio = (ev.clientX - rect.left) / rect.width;
                            const clamped = Math.max(0, Math.min(1, ratio));
                            const seek_time = clamped * video.duration;
                            video.currentTime = seek_time;
                            setClipTime(seek_time);
                        };

                        // initial seek
                        seekFromEvent(e.nativeEvent as PointerEvent);
                        const move = (ev: PointerEvent) => { seekFromEvent(ev); };

                        const up = () => {
                            window.removeEventListener("pointermove", move);
                            window.removeEventListener("pointerup", up);
                        };

                        window.addEventListener("pointermove", move);
                        window.addEventListener("pointerup", up);
                    }}
                >

                    {/* TRIM START LINE */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${(trimStart / (clipInfo?.duration || 1)) * 100}%`,
                            top: -6,
                            bottom: -6,
                            width: 2,
                            background: "yellow",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${(trimStart / (clipInfo?.duration || 1)) * 100}%`,
                            background: "rgba(207, 255, 103, 0.34)",
                            pointerEvents: "none",
                            zIndex: 3,
                        }}
                    />

                    {/* TRIM END LINE */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${(trimEnd / (clipInfo?.duration || 1)) * 100}%`,
                            top: -6,
                            bottom: -6,
                            width: 2,
                            background: "red",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: `${(trimEnd / (clipInfo?.duration || 1)) * 100}%`,
                            top: 0,
                            bottom: 0,
                            width: `${((clipInfo?.duration - trimEnd) / (clipInfo?.duration || 1)) * 100}%`,
                            background: "rgba(254, 82, 82, 0.34)",
                            pointerEvents: "none",
                            zIndex: 3,
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            left: `${(clipTime / (clipInfo?.duration || 1)) * 100}%`,
                            top: -6,
                            bottom: -6,
                            width: 4,
                            background: "white",
                            pointerEvents: "none",
                            zIndex: 5,
                        }}
                    />



                </div>

                <span
                    style={{
                        color: "white",
                        fontSize: 12,
                        minWidth: 50,
                        textAlign: "right",
                        fontFamily: "monospace",
                    }}
                >
                    {clipInfo?.duration?.toFixed(2) ?? "0.00"}
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
                                    video.currentTime = seek_time
                                    setClipTime(seek_time);
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




            </div>
        </div>
    );
});