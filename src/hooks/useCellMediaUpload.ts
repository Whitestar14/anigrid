import { useRef, useCallback } from 'react';

export function useCellMediaUpload(onUploadSuccess: (fileOrBase64: string | File) => void, readAsBase64: boolean = true) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (readAsBase64) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadSuccess(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      onUploadSuccess(file);
    }
    
    // Reset input so the same file can be selected again
    if (e.target) {
        e.target.value = '';
    }
  }, [onUploadSuccess, readAsBase64]);

  const triggerPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    triggerPicker,
    handleFileChange,
  };
}
