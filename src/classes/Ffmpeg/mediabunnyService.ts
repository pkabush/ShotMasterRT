import { ALL_FORMATS, AudioBufferSource, BlobSource, BufferTarget,  CanvasSource,  Conversion, Input, Mp4OutputFormat, Output,  QUALITY_HIGH } from "mediabunny";
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





async function getAudioDuration(audioBlob: Blob): Promise<number> {
  const input = new Input({
    source: new BlobSource(audioBlob),
    formats: ALL_FORMATS, // Ensures all container formats (.mp3, .wav, .aac, etc.) are matched
  });

  // Dynamically scans track frames to calculate exact duration in seconds
  const durationSeconds = await input.computeDuration();
  return durationSeconds;
}

interface ImageToVideoOptions {
  fps?: number;
  width?: number;
  height?: number;
}


export async function mb_createVideoFromImageAndAudio(
  imageBlob: Blob,
  audioBlob: Blob,
  options: ImageToVideoOptions = {}
): Promise<Blob|null> {
  const { fps = 30, width = 720, height = 1280 } = options;

  // 1. EXTRACT DURATION DYNAMICALLY FROM AUDIO BLOB
  const durationSeconds = await getAudioDuration(audioBlob);
  // 1. Decode the audio blob into an AudioBuffer
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioArrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
  await audioContext.close();

  // 2. Load the image blob into an ImageBitmap for fast canvas rendering
  const imageBitmap = await createImageBitmap(imageBlob);

  // 3. Prepare the canvas and draw the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');
  
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // 4. Setup the Mediabunny output container
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  // 5. Add the video track using the canvas
  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH,
  });
  output.addVideoTrack(videoSource);

  // 6. Add the audio track
  const audioSource = new AudioBufferSource({
    codec: 'aac',
    bitrate: QUALITY_HIGH,
  });
  output.addAudioTrack(audioSource);

  // 7. Process the media streams
  await output.start();

  // Write video frames sequentially
  const totalFrames = fps * durationSeconds;
  for (let frame = 0; frame < totalFrames; frame++) {
    await videoSource.add(frame / fps, 1 / fps);
  }

  // Push the decoded audio data
  await audioSource.add(audioBuffer);
  await audioSource.close();

  // 8. Finalize and return the result as a Blob
  await output.finalize();
  
  // Clean up the image asset memory
  imageBitmap.close();

  const finalVideoBuffer = output.target.buffer;
  if(!finalVideoBuffer) return null;
  return new Blob([finalVideoBuffer], { type: 'video/mp4' });
}