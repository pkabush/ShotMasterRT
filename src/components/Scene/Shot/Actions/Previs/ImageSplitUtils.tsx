import type { LocalImage } from "../../../../../classes/fileSystem/LocalImage";

export interface ImageTile {
    row: number;
    column: number;

    x: number;
    y: number;

    width: number;
    height: number;

    blob: Blob;
    url: string;
}

/**
 * Splits a LocalImage into a rows × columns grid.
 *
 * Nothing is written to the filesystem.
 *
 * The returned `url` values can be used directly:
 *
 *   <img src={tile.url} />
 *
 * Remember to call `URL.revokeObjectURL(tile.url)` when you're
 * finished with the tiles.
 */
export async function splitImageIntoTiles(
    image: LocalImage,
    rows: number,
    columns: number,
    outputWidth: number = 720,
    outputHeight: number = 1280
): Promise<ImageTile[]> {
    if (!Number.isInteger(rows) || rows <= 0) {
        throw new Error("rows must be a positive integer");
    }

    if (!Number.isInteger(columns) || columns <= 0) {
        throw new Error("columns must be a positive integer");
    }

    if (!Number.isInteger(outputWidth) || outputWidth <= 0) {
        throw new Error("outputWidth must be a positive integer");
    }

    if (!Number.isInteger(outputHeight) || outputHeight <= 0) {
        throw new Error("outputHeight must be a positive integer");
    }

    await image.ensureImageMetaLoaded();

    const sourceUrl = await image.getUrlObject();
    const sourceImage = await loadHtmlImage(sourceUrl);

    const imageWidth =
        sourceImage.naturalWidth || sourceImage.width;

    const imageHeight =
        sourceImage.naturalHeight || sourceImage.height;

    const tiles: ImageTile[] = [];

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const x = Math.floor(
                (column * imageWidth) / columns
            );

            const y = Math.floor(
                (row * imageHeight) / rows
            );

            const right = Math.floor(
                ((column + 1) * imageWidth) / columns
            );

            const bottom = Math.floor(
                ((row + 1) * imageHeight) / rows
            );

            const width = right - x;
            const height = bottom - y;

            const canvas = document.createElement("canvas");

            canvas.width = outputWidth;
            canvas.height = outputHeight;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
                throw new Error(
                    "Could not create 2D canvas context"
                );
            }

            const scale = Math.min(
                outputWidth / width,
                outputHeight / height
            );

            const drawWidth = Math.round(width * scale);
            const drawHeight = Math.round(height * scale);

            const offsetX = Math.round(
                (outputWidth - drawWidth) / 2
            );

            const offsetY = Math.round(
                (outputHeight - drawHeight) / 2
            );

            ctx.drawImage(
                sourceImage,

                // Source rectangle
                x,
                y,
                width,
                height,

                // Destination rectangle
                offsetX,
                offsetY,
                drawWidth,
                drawHeight
            );

            const blob = await canvasToBlob(
                canvas,
                image.base64Data?.mime || "image/png"
            );

            const url = URL.createObjectURL(blob);

            tiles.push({
                row,
                column,
                x,
                y,
                width,
                height,
                blob,
                url,
            });
        }
    }

    return tiles;
}


function loadHtmlImage(
    url: string
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => {
            reject(new Error("Failed to load source image"));
        };

        img.src = url;
    });
}


function canvasToBlob(
    canvas: HTMLCanvasElement,
    mime: string
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to create image blob"));
                    return;
                }

                resolve(blob);
            },
            mime,
            1.0
        );
    });
}


export async function downloadImageTiles(
    tiles: ImageTile[],
    filenamePrefix = "tile"
): Promise<void> {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        const extension = mimeToExtension(tile.blob.type);
        const filename =
            `${filenamePrefix}_${String(i + 1).padStart(3, "0")}.${extension}`;

        const link = document.createElement("a");

        link.href = tile.url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay helps browsers handle multiple downloads
        // without dropping some of them.
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}


function mimeToExtension(mime: string): string {
    switch (mime) {
        case "image/jpeg":
            return "jpg";

        case "image/webp":
            return "webp";

        case "image/gif":
            return "gif";

        case "image/png":
        default:
            return "png";
    }
}


export async function extractImageTile(
    image: LocalImage,
    rows: number,
    columns: number,
    index: number,
    outputWidth: number = 720,
    outputHeight: number = 1280
): Promise<ImageTile> {
    if (!Number.isInteger(rows) || rows <= 0) {
        throw new Error("rows must be a positive integer");
    }

    if (!Number.isInteger(columns) || columns <= 0) {
        throw new Error("columns must be a positive integer");
    }

    if (!Number.isInteger(index) || index < 0 || index >= rows * columns) {
        throw new Error(
            `index must be an integer between 0 and ${rows * columns - 1}`
        );
    }

    if (!Number.isInteger(outputWidth) || outputWidth <= 0) {
        throw new Error("outputWidth must be a positive integer");
    }

    if (!Number.isInteger(outputHeight) || outputHeight <= 0) {
        throw new Error("outputHeight must be a positive integer");
    }

    await image.ensureImageMetaLoaded();

    const sourceUrl = await image.getUrlObject();
    const sourceImage = await loadHtmlImage(sourceUrl);

    const imageWidth =
        sourceImage.naturalWidth || sourceImage.width;

    const imageHeight =
        sourceImage.naturalHeight || sourceImage.height;

    // Convert linear index to row/column.
    const row = Math.floor(index / columns);
    const column = index % columns;

    // Calculate the exact same source rectangle as splitImageIntoTiles().
    const x = Math.floor(
        (column * imageWidth) / columns
    );

    const y = Math.floor(
        (row * imageHeight) / rows
    );

    const right = Math.floor(
        ((column + 1) * imageWidth) / columns
    );

    const bottom = Math.floor(
        ((row + 1) * imageHeight) / rows
    );

    const width = right - x;
    const height = bottom - y;

    const canvas = document.createElement("canvas");

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Could not create 2D canvas context"
        );
    }

    const scale = Math.min(
        outputWidth / width,
        outputHeight / height
    );

    const drawWidth = Math.round(width * scale);
    const drawHeight = Math.round(height * scale);

    const offsetX = Math.round(
        (outputWidth - drawWidth) / 2
    );

    const offsetY = Math.round(
        (outputHeight - drawHeight) / 2
    );

    ctx.drawImage(
        sourceImage,

        // Source rectangle
        x,
        y,
        width,
        height,

        // Destination rectangle
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
    );

    const blob = await canvasToBlob(
        canvas,
        image.base64Data?.mime || "image/png"
    );

    const url = URL.createObjectURL(blob);

    return {
        row,
        column,
        x,
        y,
        width,
        height,
        blob,
        url,
    };
}






export async function bakeTextOntoImage(
    imageBlob: Blob,
    text: string,
    options?: {
        cqw?: number;
        bottom?: number;
        maxTextHeight?: number;
        padding?: number;
        fontFamily?: string;
    }
): Promise<Blob> {
    const {
        cqw = 5,
        bottom = 0.20,
        maxTextHeight = 0.45,
        padding = 0.02,
        fontFamily = "Arial, sans-serif",
    } = options ?? {};

    if (!text.trim()) return imageBlob;

    const imageUrl = URL.createObjectURL(imageBlob);

    try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image blob"));
            img.src = imageUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;        

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create canvas context");

        const width = canvas.width;
        const height = canvas.height;
        ctx.drawImage(img, 0, 0, width, height);

        let scale = 1;
        const baseFontSize = width * (cqw / 100);
        const fontSize = baseFontSize * scale; 

        const lineHeight = fontSize * 1.4;
        ctx.font = `600 ${fontSize}px ${fontFamily}`;

        const horizontalPadding = width * padding;
        const maxWidth = width - horizontalPadding * 2;

        const verticalPadding = horizontalPadding;
        const maxBoxHeight = height * maxTextHeight;
        const maxContentHeight = Math.max(
            0,
            maxBoxHeight - verticalPadding * 2
        );

        console.log( {
            width,
            height,
            baseFontSize,
            fontSize,
        })        

        // Wrap text, preserving explicit newlines.
        const lines: string[] = [];

        for (const paragraph of text.split("\n")) {
            if (!paragraph) {
                lines.push("");
                continue;
            }

            let line = "";

            for (const word of paragraph.split(/\s+/)) {
                const candidate = line
                    ? `${line} ${word}`
                    : word;

                if (ctx.measureText(candidate).width <= maxWidth) {
                    line = candidate;
                    continue;
                }

                if (line) lines.push(line);

                line = "";

                // Break long words when they exceed the available width.
                for (const char of word) {
                    const next = line + char;

                    if (
                        ctx.measureText(next).width > maxWidth &&
                        line
                    ) {
                        lines.push(line);
                        line = char;
                    } else {
                        line = next;
                    }
                }
            }

            if (line) lines.push(line);
        }

        const maxLines = Math.max(
            1,
            Math.floor(maxContentHeight / lineHeight)
        );

        if (lines.length > maxLines) {
            lines.length = maxLines;

            let last = lines[maxLines - 1];

            while (
                last.length > 0 &&
                ctx.measureText(last + "…").width > maxWidth
            ) {
                last = last.slice(0, -1);
            }

            lines[maxLines - 1] = last + "…";
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ffffffed";

        const textHeight = lines.length * lineHeight;

        const startY =
            height * (1 - bottom) -
            verticalPadding -
            textHeight;

        // Scale shadow offsets and blur by the scale factor so shadows don't look invisible on high-res images
        const shadowPasses = [
            { x: -1 * scale, y: -1 * scale, blur: 2 * scale },
            { x: 1 * scale, y: -1 * scale, blur: 2 * scale },
            { x: -1 * scale, y: 1 * scale, blur: 2 * scale },
            { x: 1 * scale, y: 1 * scale, blur: 2 * scale },
            { x: 0, y: 2 * scale, blur: 4 * scale },
        ];

        for (const pass of shadowPasses) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowOffsetX = pass.x;
            ctx.shadowOffsetY = pass.y;
            ctx.shadowBlur = pass.blur;

            lines.forEach((line, i) => {
                ctx.fillText(
                    line,
                    width / 2,
                    startY + i * lineHeight,
                    maxWidth
                );
            });
        }

        // Draw text without shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        lines.forEach((line, i) => {
            ctx.fillText(
                line,
                width / 2,
                startY + i * lineHeight,
                maxWidth
            );
        });

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to export image"));
                },
                imageBlob.type === "image/jpeg"
                    ? "image/jpeg"
                    : "image/png",
                0.95
            );
        });
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}