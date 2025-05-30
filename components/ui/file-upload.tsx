"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  accept = "*",
  multiple = false,
  maxFileSize = 5 * 1024 * 1024, // 기본 5MB 제한
  className = "",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 파일 처리 함수
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // 파일 크기 검증
      const oversizedFiles = fileArray.filter(file => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        setError(`일부 파일이 최대 크기(${maxFileSize / (1024 * 1024)}MB)를 초과했습니다.`);
        return;
      }

      // 파일 형식 검증
      if (accept !== "*") {
        const acceptedTypes = accept.split(",").map(type => type.trim());
        const invalidFiles = fileArray.filter(file => {
          return !acceptedTypes.some(type => {
            // image/* 형식 처리
            if (type.endsWith("/*")) {
              const mainType = type.split("/")[0];
              return file.type.startsWith(`${mainType}/`);
            }
            return file.type === type || type === "*";
          });
        });

        if (invalidFiles.length > 0) {
          setError(`일부 파일이 허용되지 않는 형식입니다. 허용 형식: ${accept}`);
          return;
        }
      }

      // 다중 파일 검증
      if (!multiple && fileArray.length > 1) {
        setError("다중 파일 업로드가 허용되지 않습니다.");
        return;
      }

      // 유효한 파일들 전달
      onFilesSelected(fileArray);
    },
    [accept, maxFileSize, multiple, onFilesSelected]
  );

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // 파일 선택 핸들러
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // 같은 파일을 다시 선택할 수 있도록 input 값을 초기화
        e.target.value = "";
      }
    },
    [processFiles]
  );

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="text-4xl text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
          </div>
          <div className="text-lg font-semibold">
            {isDragging ? "파일을 여기에 놓으세요" : "클릭하거나 파일을 끌어다 놓으세요"}
          </div>
          <div className="text-sm text-muted-foreground">
            {multiple ? "여러 파일을" : "파일을"} 업로드할 수 있습니다
            {accept !== "*" && ` (${accept})`}
          </div>
        </div>
      </div>

      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
} 