import html2canvas from 'html2canvas';

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
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#000000',
            scale: 2,
            logging: false,
        });

        let dataUrl = '';
        if (format === 'jpeg' || format === 'jpg') {
            dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        } else {
            dataUrl = canvas.toDataURL('image/png');
        }
        
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to download image', err);
    }
};
