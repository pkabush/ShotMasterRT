import { observer } from "mobx-react-lite";
import type { LocalVideo } from "../../classes/fileSystem/LocalVideo";
import { Button, Stack } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackwardStep, faCamera, faPause, faPlay, faRightFromBracket, faRightToBracket, faScissors, faVolume, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { mb_trimLocalVideo } from "../../classes/Ffmpeg/mediabunnyService";
import type { MediaFolder } from "../../classes/MediaFolder";
import { LocalImage } from "../../classes/fileSystem/LocalImage";


interface MiniVideoEditorProps {
    localVideo: LocalVideo;
}

export const MiniVideoEditor: React.FC<MiniVideoEditorProps> = observer(({ localVideo }) => {
    const [paused, setPaused] = useState(false)
    const [muted, setMuted] = useState(false)

    const [clipTime, setClipTime] = useState(0);

    const videoPlayer = useRef<(HTMLVideoElement)>(null!);

    const pausedRef = useRef(paused);
    useEffect(() => { pausedRef.current = paused; }, [paused]);

    // go to start time on Video Switch
    useEffect(() => {
        const start_timecode = localVideo.start_timecode;
        videoPlayer.current.currentTime = start_timecode;
        setClipTime(start_timecode);
    }, [localVideo]);

    // Tick
    useEffect(() => {
        let raf: number;

        const loop = () => {
            if (!pausedRef.current) {
                const video = videoPlayer.current;
                const clip = localVideo;

                if (video && clip) {
                    const time = video.currentTime;
                    const start_timecode = clip.start_timecode;
                    const end_timecode = clip.end_timecode;

                    // Advance
                    if (time >= (Math.min(end_timecode, video.duration))) {
                        video.currentTime = start_timecode;
                        setClipTime(start_timecode);
                        video.play();
                    }

                    setClipTime(time);
                }
            }

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [localVideo]);


    // ON Paused
    useEffect(() => {
        const video = videoPlayer.current;
        if (!video) return;

        if (paused) {
            video.pause();
        } else {
            video.play().catch(() => { });
        }
    }, [paused]);

    // on Sound switch
    useEffect(() => {
        videoPlayer.current.muted = muted;
    }, [muted])


    const clipTimeRef = useRef(0);
    useEffect(() => { clipTimeRef.current = clipTime; }, [clipTime]);

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
                localVideo.start_timecode = clipTimeRef.current;
                return;
            }

            if (e.code === "KeyO") {
                localVideo.end_timecode = clipTimeRef.current;
                return;
            }

            const SEEK_STEP = 0.1;
            // ARROWS → small time offset
            if (e.code === "ArrowRight") {
                e.preventDefault();
                const nextTime = Math.max(0, Math.min(videoPlayer.current.duration, videoPlayer.current.currentTime + SEEK_STEP));
                videoPlayer.current.currentTime = nextTime;
                setClipTime(nextTime);
                return;
            }

            if (e.code === "ArrowLeft") {
                e.preventDefault();
                const nextTime = Math.max(0, Math.min(videoPlayer.current.duration, videoPlayer.current.currentTime - SEEK_STEP));
                videoPlayer.current.currentTime = nextTime;
                setClipTime(nextTime);
                return;
            }


            if (e.code === "Home") {
                e.preventDefault();
                videoPlayer.current.currentTime = localVideo.start_timecode;
                setClipTime(localVideo.start_timecode);
                return;
            }

            if (e.code === "KeyM") {
                e.preventDefault();
                setMuted(prev => !prev);
                return;
            }

        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [localVideo]);

    const captureCurrentFrame = async () => {
        const video = videoPlayer.current;
        if (!video) return;

        const canvas = document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png");
        });

        if (!blob) return;

        // blob -> base64
        const rawBase64 = await blobToBase64(blob);

        const outFolder = localVideo.shot ? localVideo.shot.MediaFolder_results! : localVideo.parentFolder!;

        // create LocalImage
        const image = await LocalImage.fromBase64(
            {
                rawBase64,
                mime: blob.type || "image/png",
            },
            outFolder,
            `${localVideo.name}_frame_${clipTime.toFixed(2)}.png`
        );

        console.log("Saved frame:", image);
        alert(`Frame saved: ${image.name}
also Copied To Clipboard!`);
        image.copyToClipboard();
    };

    return <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
    }}>
        <span style={{
            position: "absolute",
            top: 2,
            left: 2,
        }}>

            <Stack direction="horizontal" gap={1}>
                <Button variant="warning" title="CUT Clip" onClick={async () => {
                    const blob = await mb_trimLocalVideo(localVideo);
                    const url = URL.createObjectURL(blob);
                    //window.open(url);
                    const cut = await localVideo.parentFolder!.downloadFromUrl(url) as LocalVideo;
                    if (cut) (localVideo.parentFolder! as MediaFolder).setSelectedMedia(cut);
                    URL.revokeObjectURL(url);

                    alert(`Clip saved: ${cut.name}
also Copied To Clipboard!`);
                    cut.copyToClipboard();

                }}>
                    <FontAwesomeIcon icon={faScissors} />
                </Button>

                <Button variant="secondary" title="Go to Clip Start [Arrow Down]" onClick={() => {
                    videoPlayer.current.currentTime = localVideo.start_timecode;
                    setClipTime(localVideo.start_timecode);
                }}>
                    <FontAwesomeIcon icon={faBackwardStep} />
                </Button>
                <Button onClick={() => { setPaused((prev) => { return !prev; }) }} variant={paused ? "success" : "warning"} title="Play/Pause [SPACE]">
                    {paused ? <FontAwesomeIcon icon={faPlay} /> : <FontAwesomeIcon icon={faPause} />}
                </Button>
                <Button onClick={() => { setMuted((prev) => { return !prev; }) }} variant={!muted ? "secondary" : "outline-secondary"} title="Mute [M]">
                    {!muted ? <FontAwesomeIcon icon={faVolume} /> : <FontAwesomeIcon icon={faVolumeXmark} />}
                </Button>


                <Button variant="secondary" title="Set clip Start Timecode [I]" onClick={() => {
                    localVideo.start_timecode = clipTime;
                }}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                </Button>
                <Button variant="secondary" title="Set clip End Timecode [O]" onClick={() => {
                    localVideo.end_timecode = clipTime;
                }}>
                    <FontAwesomeIcon icon={faRightToBracket} />
                </Button>

                <Button
                    variant="info"
                    title="Capture Current Frame"
                    onClick={captureCurrentFrame}
                >
                    <FontAwesomeIcon icon={faCamera} />
                </Button>


            </Stack>


            <strong>{clipTime.toFixed(2)} / {localVideo.duration.toFixed(2)}</strong>
            <br />
            <div style={{ color: '#a1a1a1', fontSize: '14px', fontFamily: 'monospace' }}>
                total: {localVideo.duration}
                <br />
                time: {clipTime}
                <br />
                start_timecode: {localVideo.start_timecode}
                <br />
                end_timecode: {localVideo.end_timecode}
            </div>

        </span>





        {/* Video Player*/}
        <video
            src={localVideo.urlObject || ""}
            preload="auto"
            //controls={true}
            //onEnded={handleEnded}
            autoPlay={!paused}
            ref={videoPlayer}
            onClick={() => { setPaused((prev) => { return !prev; }) }}
            style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
                display: "block",
                paddingBottom: "34px",
                paddingTop: "42px",
            }}
        />

        {/* 🎚 Video Seek Bar */}
        <div
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,


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
                    const video = videoPlayer.current;
                    if (!video) return;

                    const rect = e.currentTarget.getBoundingClientRect();

                    const seekFromEvent = (ev: PointerEvent) => {
                        const ratio = (ev.clientX - rect.left) / rect.width;
                        const clamped = Math.max(0, Math.min(1, ratio));
                        const seek_time = clamped * (localVideo.duration ?? 5.0);
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
                        left: `${(localVideo.start_timecode / localVideo.duration) * 100}%`,
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
                        width: `${(localVideo.start_timecode / localVideo.duration) * 100}%`,
                        background: "rgba(207, 255, 103, 0.34)",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                />

                {/* TRIM END LINE */}
                <div
                    style={{
                        position: "absolute",
                        left: `${(localVideo.end_timecode / localVideo.duration) * 100}%`,
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
                        left: `${(localVideo.end_timecode / localVideo.duration) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: `${((localVideo.duration - localVideo.end_timecode) / localVideo.duration) * 100}%`,
                        background: "rgba(254, 82, 82, 0.34)",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                />

                {/** CURRENT TIME POINTER */}
                <div
                    style={{
                        position: "absolute",
                        left: `${(clipTime / localVideo.duration) * 100}%`,
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
                {localVideo.duration.toFixed(2) ?? "0.00"}
            </span>
        </div>

    </div>

})



export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const result = reader.result as string;

            // remove data:mime;base64,
            const base64 = result.split(",")[1];

            resolve(base64);
        };

        reader.onerror = reject;

        reader.readAsDataURL(blob);
    });
}