import { toPng, toJpeg } from "html-to-image";

export type ImageFormat = "png" | "jpeg" | "webp";

export const readFileAsDataURL = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
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
