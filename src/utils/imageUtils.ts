import { toPng, toJpeg } from "html-to-image";

export type ImageFormat = "png" | "jpeg" | "webp";

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
    await new Promise((resolve) => setTimeout(resolve, 100));

    let dataUrl = "";
    const options = {
      pixelRatio: qualityScale,
      cacheBust: true,
      skipAutoScale: false,
      httpTimeout: 5000,
    };

    if (format === "jpeg" || format === "jpg") {
      dataUrl = await toJpeg(element, { ...options, quality: 0.95 });
    } else {
      dataUrl = await toPng(element, options);
    }

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
