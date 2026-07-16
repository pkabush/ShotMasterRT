import { observer } from "mobx-react-lite";
import type { SceneViewProps } from "../SceneView";
import { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MediaPreview from "../MediaComponents/MediaPreview";
import { Badge, Button, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackwardFast, faBackwardStep, faPause, faPlay, faRightFromBracket, faRightToBracket, faRotate, faVolume, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { combineVideosFromUint8 } from "../../classes/Ffmpeg/FFmpegService";
import { mb_trimLocalVideo } from "../../classes/Ffmpeg/mediabunnyService";
import type { LocalMedia } from "../../classes/fileSystem/LocalMedia";


export const SceneTimelineView: React.FC<SceneViewProps> = observer(({ scene }) => {

    useEffect(() => {
        scene.shots.forEach(s => {
            const media = s.previewMedia;
            if (media instanceof LocalVideo) {
                media.ensureDurationLoaded();
            }
        });
    }, [scene]);

    const clips = useMemo(() => {
        return scene.shots_ordered.map(shot => ({
            video: shot.previewMedia,
            label: shot.name
        }));
    }, [scene.shots_ordered]);

    const onIndexReorder = useCallback((old_index: number, new_index: number) => {
        scene.set_shot_list_index(scene.shots_ordered[old_index], new_index);
    }, [clips, scene])


    return <>
        <VideoPlaylist clips={clips} onIndexReorder={onIndexReorder} />
    </>
});

type VideoClip = {
    video: LocalMedia | null;
    label: string;
};

interface VideoPlaylistProps {
    clips: VideoClip[];
    onIndexReorder?: (oldIndex: number, newIndex: number) => void;
}




export const VideoPlaylist: React.FC<VideoPlaylistProps> = observer(({
    clips,
    onIndexReorder,
}) => {

    const SEEK_STEP = 0.1;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [clipTime, setClipTime] = useState(0);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const pendingSeekRef = useRef<number | null>(null);

    const [paused, setPaused] = useState(true)
    const [muted, setMuted] = useState(false)
    const [loop, setLoop] = useState(false)

    const [clipInfo, setClipInfo] = useState<any>(null)

    // Reset on scene Change
    useEffect(() => {
        setCurrentIndex(0);
        setClipTime(0);
        setPaused(true);
        pendingSeekRef.current = null;
        advancedClipRef.current = false;
    }, [clips]);

    const totalDuration = clips.reduce((sum, s) => {
        const start = s.video?.start_timecode ?? 0;
        const end = s.video?.end_timecode ?? 2;
        return sum + (end - start);
    }, 0);

    // handle switching clips
    useEffect(() => {
        const currentVideo = videoRefs.current[currentIndex];
        if (!currentVideo) return;

        // pause all others
        videoRefs.current.forEach((v, i) => {
            if (!v) return;
            if (i !== currentIndex) {
                const start_timecode = clips[i].video?.start_timecode ?? 0;
                v.pause(); v.currentTime = start_timecode;
            }
        });

        const seek = pendingSeekRef.current;
        pendingSeekRef.current = null;

        const play = async () => {
            if (!currentVideo.src) {
                currentVideo.src = "/assets/sounds/background_music.mp3";
                currentVideo.volume = 0.01;

                const preview = clips[currentIndex].video
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

            const clip_start_timecode = clips[currentIndex].video?.start_timecode ?? 0;

            currentVideo.currentTime = seek ?? clip_start_timecode;
            setClipTime(seek ?? clip_start_timecode);
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

                if (video && clip) {
                    const time = video.currentTime;
                    const start_timecode = clip.video?.start_timecode ?? 0;
                    const end_timecode = clip.video?.end_timecode ?? 2;


                    // Advance
                    if (time >= (Math.min(end_timecode, video.duration)) && !advancedClipRef.current) {
                        advancedClipRef.current = true;

                        video.currentTime = start_timecode;
                        setClipTime(start_timecode);

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
                    if (time < (Math.min(end_timecode, video.duration))) {
                        advancedClipRef.current = false;
                        setClipTime(time);
                    }
                }
            }

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [clips]);

    // ON Paused
    useEffect(() => {
        const video = videoRefs.current[currentIndexRef.current];
        if (paused) video?.pause();
        else video?.play();
    }, [paused])

    // on Sound switch
    useEffect(() => {
        videoRefs.current.forEach((v, _) => {
            if (!v) return;
            v.muted = muted;
        });
    }, [muted])

    const currentClip = clips[currentIndex];
    const currestClipDuration = currentClip ? currentClip.video?.duration ?? 2.0 : 2.0;
    const currestClip_startTimecode = currentClip ? currentClip.video?.start_timecode ?? 0.0 : 0.0;
    const currestClip_endTimecode = currentClip ? currentClip.video?.end_timecode ?? 0.0 : 2.0;

    const toClipStart = () => {
        const video = videoRefs.current[currentIndexRef.current];
        if (video) { video.currentTime = currestClip_startTimecode }
        setClipTime(currestClip_startTimecode);
    }

    const toTimelineStart = () => {
        setCurrentIndex(0);
    }

    const clipTimeRef = useRef(0);
    useEffect(() => { clipTimeRef.current = clipTime; }, [clipTime]);
    const clipsRef = useRef(clips);
    useEffect(() => { clipsRef.current = clips; }, [clips]);


    const seekBy = (delta: number) => {
        const video = videoRefs.current[currentIndexRef.current];
        const clip = clipsRef.current[currentIndexRef.current];

        if (!video || !clip) return;

        const nextTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));

        video.currentTime = nextTime;
        setClipTime(nextTime);
    };

    // Keyboard Controls
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // avoid triggering while typing in inputs
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

            if (e.code === "Space") {
                e.preventDefault();
                setPaused(prev => !prev);
                return;
            }

            if (e.code === "KeyI") {
                const clip = clipsRef.current[currentIndexRef.current];
                const video = clip?.video;
                if (video) { video.start_timecode = clipTimeRef.current; }
                return;
            }

            if (e.code === "KeyO") {
                const clip = clipsRef.current[currentIndexRef.current];
                const video = clip?.video;
                if (video) { video.end_timecode = clipTimeRef.current; }
                return;
            }

            // CTRL + ARROWS → clip navigation 
            /*
            if (e.ctrlKey && e.code === "ArrowRight") {
                e.preventDefault();
                setCurrentIndex(i => Math.min(i + 1, clipsRef.current.length - 1));
                return;
            }

            if (e.ctrlKey && e.code === "ArrowLeft") {
                e.preventDefault();
                setCurrentIndex(i => Math.max(i - 1, 0));
                return;
            }*/

            if (e.ctrlKey && e.code === "ArrowLeft") {
                e.preventDefault();

                const index = currentIndexRef.current;
                const clip = clipsRef.current[index];
                const video = videoRefs.current[index];

                if (!clip || !video) return;

                const start = clip.video?.start_timecode ?? 0;
                const EPS = 0.05; // tolerance for float drift
                const atStart = Math.abs(video.currentTime - start) < EPS;

                // If already at clip start → go to previous clip
                if (atStart) {
                    setCurrentIndex(prev => { return Math.max(prev - 1, 0); });
                    return;
                }

                // Otherwise → jump to clip start
                video.currentTime = start;
                setClipTime(start);
                return;
            }

            if (e.ctrlKey && e.code === "ArrowRight") {
                e.preventDefault();
                setCurrentIndex(i => Math.min(i + 1, clipsRef.current.length - 1));
                return;
            }



            // ARROWS → small time offset
            if (e.code === "ArrowRight") {
                e.preventDefault();
                seekBy(SEEK_STEP);
                return;
            }

            if (e.code === "ArrowLeft") {
                e.preventDefault();
                seekBy(-SEEK_STEP);
                return;
            }


            if (e.code === "Home") {
                e.preventDefault();
                toTimelineStart();
                return;
            }

            if (e.code === "KeyL") {
                e.preventDefault();
                setLoop(prev => !prev);
                return;
            }

            if (e.code === "KeyM") {
                e.preventDefault();
                setMuted(prev => !prev);
                return;
            }
            console.log(e.code);

        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const [dragOver, setDragOver] = useState<{ index: number; side: "left" | "right"; } | null>(null);


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 🎬 Video Stack */}
            <div style={{ position: "relative", width: "100%", height: 700 }}>
                {clips.map((clip, i) => (
                    <>
                        <video
                            key={i}
                            ref={(el) => { videoRefs.current[i] = el; }}
                            src={
                                clip.video instanceof LocalVideo ?
                                    (clip?.video?.urlObject ?? "assets/sounds/background music.mp3") :
                                    "assets/sounds/background music.mp3"
                            }
                            preload="auto"
                            poster={
                                clip.video?.urlObject ?? ""
                            }
                            controls={false}
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
                        <Stack direction="horizontal" gap={1}>
                            <Badge bg="secondary">{clips[currentIndex] ? clips[currentIndex].label : "No"}</Badge>
                            <Button size="sm" onClick={async () => {
                                const out_videos = clips.map((clip) => { return clip.video instanceof LocalVideo ? clip.video : null });

                                const buffers: Uint8Array[] = [];
                                for (const video of out_videos) {
                                    if (!video) continue;
                                    const blob = await mb_trimLocalVideo(video);
                                    if (!blob) continue;
                                    const arrayBuffer = await blob.arrayBuffer();
                                    buffers.push(new Uint8Array(arrayBuffer));
                                }

                                // safety check
                                if (buffers.length === 0) return;

                                const finalBlob = await combineVideosFromUint8(buffers);;
                                const url = URL.createObjectURL(finalBlob);
                                window.open(url);

                            }}>Export</Button>


                            {false && <Button size="sm" onClick={async () => {
                                const video = clips[currentIndex].video;
                                if (!(video instanceof LocalVideo)) return;

                                const blob = await mb_trimLocalVideo(video);
                                const url = URL.createObjectURL(blob);
                                window.open(url);

                                video.parentFolder!.downloadFromUrl(url);

                            }}>Export Clip</Button>}
                        </Stack>
                    </h3>

                    <Stack direction="horizontal" gap={1}>

                        <Button onClick={toTimelineStart} variant="secondary" title="Go to Timeline Start [Home]">
                            <FontAwesomeIcon icon={faBackwardFast} />
                        </Button>

                        <Button onClick={toClipStart} variant="secondary" title="Go to Clip Start [Arrow Down]">
                            <FontAwesomeIcon icon={faBackwardStep} />
                        </Button>
                        <Button onClick={() => { setPaused((prev) => { return !prev; }) }} variant={paused ? "success" : "warning"} title="Play/Pause [SPACE]">
                            {paused ? <FontAwesomeIcon icon={faPlay} /> : <FontAwesomeIcon icon={faPause} />}
                        </Button>
                        <Button onClick={() => { setLoop((prev) => { return !prev; }) }} variant={loop ? "info" : "outline-secondary"} title="Loop current Clip [L]">
                            <FontAwesomeIcon icon={faRotate} />
                        </Button>
                        <Button onClick={() => { setMuted((prev) => { return !prev; }) }} variant={!muted ? "secondary" : "outline-secondary"} title="Mute [M]">
                            {!muted ? <FontAwesomeIcon icon={faVolume} /> : <FontAwesomeIcon icon={faVolumeXmark} />}
                        </Button>

                        <Button onClick={() => {
                            const video = clips[currentIndex].video;
                            if (video) video.start_timecode = clipTime;
                        }} variant="secondary" title="Set clip Start Timecode [I]">
                            <FontAwesomeIcon icon={faRightFromBracket} />
                        </Button>
                        <Button onClick={() => {
                            const video = clips[currentIndex].video;
                            if (video) video.end_timecode = clipTime;
                        }} variant="secondary" title="Set clip End Timecode [O]">
                            <FontAwesomeIcon icon={faRightToBracket} />
                        </Button>
                    </Stack>


                    <strong>{clipTime.toFixed(2)} / {clipInfo?.duration.toFixed(2)}</strong>
                    <br />
                    <div style={{ color: '#a1a1a1', fontSize: '14px', fontFamily: 'monospace' }}>
                        total: {clipInfo?.duration}
                        <br />
                        time: {clipTime}
                        <br />
                        start_timecode: {currestClip_startTimecode}
                        <br />
                        end_timecode: {currestClip_endTimecode}
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
                            const seek_time = clamped * (clips[currentIndex].video?.duration ?? 5.0);
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
                            left: `${(currestClip_startTimecode / currestClipDuration) * 100}%`,
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
                            width: `${(currestClip_startTimecode / currestClipDuration) * 100}%`,
                            background: "rgba(207, 255, 103, 0.34)",
                            pointerEvents: "none",
                            zIndex: 3,
                        }}
                    />

                    {/* TRIM END LINE */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${(currestClip_endTimecode / currestClipDuration) * 100}%`,
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
                            left: `${(currestClip_endTimecode / currestClipDuration) * 100}%`,
                            top: 0,
                            bottom: 0,
                            width: `${((currestClipDuration - currestClip_endTimecode) / currestClipDuration) * 100}%`,
                            background: "rgba(254, 82, 82, 0.34)",
                            pointerEvents: "none",
                            zIndex: 3,
                        }}
                    />

                    {/** CURRENT TIME POINTER */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${(clipTime / currestClipDuration) * 100}%`,
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

                    const duration = (clips[index].video?.end_timecode ?? 2) - (clips[index].video?.start_timecode ?? 0);
                    const widthPercent = (duration / totalDuration) * 100;

                    return (
                        <div
                            key={index}
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
                                const seek_time = ratio * duration + (clips[index].video?.start_timecode ?? 0);

                                // If same index
                                if (index === currentIndex) {
                                    video.currentTime = seek_time
                                    setClipTime(seek_time);
                                    return;
                                }

                                pendingSeekRef.current = seek_time;
                                setCurrentIndex(index);
                            }}

                            // DRAGGABLES
                            draggable={true}
                            onDragStart={(e) => {
                                //e.dataTransfer.setData("LocalFilePath", shot.path);
                                e.dataTransfer.setData("TimelineDragIndex", index.toString());
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const mouseX = e.clientX - rect.left;
                                const side = mouseX > rect.width / 2 ? "right" : "left";
                                setDragOver({ index, side, });
                            }}
                            onDragLeave={() => {
                                setDragOver(null);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(null);

                                const dragged_index = e.dataTransfer.getData("TimelineDragIndex");
                                let new_index = index;
                                // Mouse position inside target
                                const rect = e.currentTarget.getBoundingClientRect();
                                const mouseX = e.clientX - rect.left;
                                const droppedOnRight = mouseX > rect.width / 2;
                                if (droppedOnRight) { new_index += 1; }

                                //shot.scene.set_shot_list_index(shot.scene.shots_ordered[parseInt(dragged_index)], new_index);
                                onIndexReorder?.(parseInt(dragged_index), new_index);
                            }}
                        >
                            <span style={{
                                position: "absolute",
                                bottom: -2,
                                left: -2,
                            }}>
                                <Badge bg="success">{clip.label}</Badge>
                            </span>

                            <MediaPreview media={clip.video} height={"100%"} draggable={false} muted={true} />

                            {/** STYLUS */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    background: "red",
                                    left: `${index === currentIndex ? ((clipTime - clip.video?.start_timecode) / duration) * 100 : "0"}% `,
                                    pointerEvents: "none",
                                    display: index === currentIndex ? "block" : "none",
                                    //display: "none",
                                }}
                            />

                            {/** DRAG AND DROP HIGHLIGHT */}
                            {dragOver?.index === index && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        width: 12,
                                        left: dragOver.side === "left" ? 0 : "100%",
                                        transform: dragOver.side === "right" ? "translateX(-12px)" : undefined,
                                        background: "#ffbf10",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    );
                })}

            </div>
        </div>
    );
});