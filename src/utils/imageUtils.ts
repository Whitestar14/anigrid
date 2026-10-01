import { toPng, toJpeg } from "html-to-image";

export type ImageFormat = "png" | "jpeg" | "webp";

/** Marks the element that is the board itself, inside the export sheet. */
export const EXPORT_BOARD_ATTR = "data-export-board";

export async function withBoardHuggingLayout<T>(
  sheet: HTMLElement,
  run: () => Promise<T>
): Promise<T> {
  const board = sheet.querySelector<HTMLElement>(`[${EXPORT_BOARD_ATTR}]`);
  const target = board ?? sheet;
  const styles = getComputedStyle(sheet);
  const horizontalPadding =
    parseFloat(styles.paddingLeft || "0") +
    parseFloat(styles.paddingRight || "0");
  const boardWidth = Math.ceil(target.getBoundingClientRect().width);

  const previousWidth = sheet.style.width;
  if (boardWidth > 0) {
    sheet.style.width = `${boardWidth + horizontalPadding}px`;
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

  try {
    return await run();
  } finally {
    sheet.style.width = previousWidth;
  }
}

export const readFileAsDataURL = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 800; // Limit max dimension to save state space
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to original if canvas fails
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as WebP at 80% quality
        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback to uncompressed if image decoding fails
        resolve(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const downloadGrid = async (
  element: HTMLElement,
  title: string,
  format: string = "png",
  qualityScale: number = 2
) => {
  try {
    const options = {
      pixelRatio: qualityScale,
      cacheBust: false,
      skipAutoScale: false,
      httpTimeout: 5000,
    };

    // The board sits inside the sheet; the sheet is what gets captured, pinned
    // to the board's own width so the background wraps the artwork.
    const dataUrl = await withBoardHuggingLayout(element, async () => {
      if (format === "jpeg" || format === "jpg") {
        return toJpeg(element, { ...options, quality: 0.95 });
      }
      return toPng(element, options);
    });

    const link = document.createElement("a");
    link.download = `${title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Failed to download image", err);
    throw new Error(
      "Export failed. External images cannot be embedded due to CORS restrictions."
    );
  }
};

export const copyGrid = async (
  element: HTMLElement,
  qualityScale: number = 2
) => {
  try {
    const options = {
      pixelRatio: qualityScale,
      cacheBust: false,
      skipAutoScale: false,
      httpTimeout: 5000,
    };

    const dataUrl = await withBoardHuggingLayout(element, () =>
      toPng(element, options)
    );
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    
    await navigator.clipboard.write([
      new window.ClipboardItem({ 'image/png': blob })
    ]);
  } catch (err) {
    console.error("Failed to copy image", err);
    throw new Error(
      "Copy failed. Your browser might not support clipboard operations or external images cannot be embedded."
    );
  }
};
