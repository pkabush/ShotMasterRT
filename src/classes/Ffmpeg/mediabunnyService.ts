import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output } from "mediabunny";
import type { LocalVideo } from "../fileSystem/LocalVideo";

export async function mb_trimLocalVideo(localVideo: LocalVideo) {
    localVideo.log();

    const input = new Input({
        formats: ALL_FORMATS, // Supporting all file formats
        source: new BlobSource(await localVideo.getFile()),
    });

    const duration = await input.computeDuration(); // in seconds
    console.log(duration);

    const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
    });

    const conversion = await Conversion.init({
        input,
        output,
        trim: {
            start: localVideo.start_timecode,  // Start at 10 seconds
            end: localVideo.end_timecode,    // End at 25 seconds
        },        
        video: {
            width: 1080,
            height: 1920,
            fit: 'contain',
            bitrate: 20_000_000,
            frameRate:24,
        }
    });
    

    await conversion.execute();    

    const resultBuffer = output.target.buffer;    
    const blob = new Blob([resultBuffer!], { type: "video/webm" });    
    return blob;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
}

