"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, Loader2, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FileUploaderProps {
  onFileRead: (dataUrl: string) => void;
  acceptedMimeTypes: string[];
  fileType: 'image' | 'audio' | 'video';
}

export function FileUploader({ onFileRead, acceptedMimeTypes, fileType }: FileUploaderProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        setIsReading(true);

        if (fileType === 'image' && selectedFile.type.startsWith('image/')) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview(null);
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onFileRead(event.target.result as string);
          }
          setIsReading(false);
        };
        reader.onerror = () => {
            setIsReading(false);
            setFile(null);
            setPreview(null);
        };
        reader.readAsDataURL(selectedFile);
      }
    },
    [onFileRead, fileType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: false,
  });

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    onFileRead("");
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors",
            isDragActive ? "border-primary" : "border-input"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
            {isDragActive ? (
              <p className="font-semibold text-primary">{t('drop_file_here')}</p>
            ) : (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">{t('drag_drop_file').split(',')[0]}</span>, {t('drag_drop_file').split(',')[1]}
                </p>
                <p className="text-xs text-muted-foreground">{fileType.toUpperCase()} files</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-64 p-4 border rounded-lg bg-card relative flex items-center justify-center">
            <button onClick={clearFile} className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/50 hover:bg-background transition-colors">
                <X className="w-4 h-4" />
            </button>

            {isReading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Reading file...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                    {fileType === 'image' && preview ? (
                        <Image src={preview} alt="Image preview" width={150} height={150} className="max-h-[150px] w-auto object-contain rounded-md" />
                    ) : (
                        <FileIcon className="w-12 h-12 text-primary" />
                    )}
                    <p className="font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
