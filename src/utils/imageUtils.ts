import { toPng, toJpeg } from 'html-to-image';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export const readFileAsDataURL = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const downloadGrid = async (element: HTMLElement, title: string, format: string = 'png') => {
    try {
        // Small delay to ensure any layout shifts are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let dataUrl = '';
        if (format === 'jpeg' || format === 'jpg') {
            dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#000' });
        } else {
            dataUrl = await toPng(element, { backgroundColor: '#000' });
        }
        
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to download image', err);
    }
};
