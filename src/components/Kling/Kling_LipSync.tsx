// Kling_LipSync.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import MediaGalleryVideo from "../MediaComponents/MediaGalleryVideo";
import MediaGalleryAudio from "../MediaComponents/MediaGalleryAudio";
import { MediaFolderGallery } from "../MediaFolderGallery";
import type { Shot } from "../../classes/Shot";
import type { LocalAudio } from "../../classes/LocalAudio";
import LoadingSpinner from "../Atomic/LoadingSpinner";

interface Kling_LipSyncProps {
    shot: Shot;
}

export const Kling_LipSync: React.FC<Kling_LipSyncProps> = observer(({ shot }) => {
    return (
        <div className="mb-3">

            {/* Buttons */}
            <div className="mb-3 d-flex gap-2">
                <button
                    className="btn btn-sm btn-outline-success"
                    onClick={async () => { shot.Kling_IdentyfiFace(); }}
                >
                    Identify Face
                </button>

                <button
                    className="btn btn-sm btn-outline-success"
                    onClick={async () => { shot.Kling_LypSync(); }}
                >
                    Lip Sync
                </button>

                <LoadingSpinner isLoading={shot.is_submitting_video} asButton />
            </div>

            {/* Output Video */}
            {shot.outVideo ? (
                <MediaGalleryVideo
                    localVideo={shot.outVideo}
                    height={400}
                    topRightExtra={<></>}
                />
            ) : (
                <div className="text-left text-muted my-3">
                    No OutVideo Selected
                </div>
            )}

            {/* Faces */}
            {shot.kling_face_id_data?.face_data?.length > 0 && (
                <div className="d-flex overflow-auto py-2">
                    {shot.kling_face_id_data.face_data.map((face: any, index: number) => (
                        <div key={face.face_id || index} className="position-relative flex-shrink-0 me-3">
                            <img
                                src={face.face_image}
                                alt={`Face ${index + 1}`}
                                className="rounded"
                                style={{ width: "96px", height: "96px", objectFit: "cover" }}
                            />

                            {/* ID at top */}
                            <div
                                className="position-absolute top-0 start-50 translate-middle-x text-white text-center w-100"
                                style={{
                                    textShadow: "1px 1px 2px black",
                                    fontSize: "0.75rem",
                                    lineHeight: "1rem",
                                }}
                            >
                                ID: {face.face_id}
                            </div>

                            {/* Time at bottom */}
                            <div
                                className="position-absolute bottom-0 start-50 translate-middle-x text-white text-center w-100"
                                style={{
                                    textShadow: "1px 1px 2px black",
                                    fontSize: "0.75rem",
                                    lineHeight: "1rem",
                                }}
                            >
                                {Math.floor(face.start_time / 1000)}s - {Math.floor(face.end_time / 1000)}s
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Audios */}
            {["ID-0", "ID-1", "ID-2"].map((tag) => {
                const audio = shot.MediaFolder_Audio?.getFirstMediaWithTag(tag) as LocalAudio | null;
                if (!audio) return null;

                return (
                    <div key={tag} className="mb-3 text-left">
                        {/* Audio name above */}
                        <div className="mb-1 fw-bold">{tag}</div>

                        <MediaGalleryAudio
                            localAudio={audio}
                            width={500}
                            height={100}
                            autoPlay={false}
                        />
                    </div>
                );
            })}

            {/* Media Folder Galleries */}
            <MediaFolderGallery mediaFolder={shot.MediaFolder_genVideo} label="Generated Videos" />
            <MediaFolderGallery mediaFolder={shot.MediaFolder_Audio} label="Generated Audios" />

            
        </div>
    );
});
