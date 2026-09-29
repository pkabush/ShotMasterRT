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
