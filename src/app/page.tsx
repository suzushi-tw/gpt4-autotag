"use client";
import { useCallback, useMemo } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();

      // 將所有檔案加入 FormData
      files.forEach((file) => {
        // 保留檔案的相對路徑
        const relativePath = file.webkitRelativePath || file.name;
        formData.append('files', file, relativePath);
      });

      const response = await fetch('/api/tag', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('上傳成功:', data);

    } catch (error) {
      console.error('上傳錯誤:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles);
  }, []);

  const dropzoneOptions = useMemo(() => ({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    // @ts-ignore
    directory: true,
    // @ts-ignore
    webkitdirectory: true,
    multiple: true
  } as DropzoneOptions), [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          資料夾圖片上傳
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div
            {...getRootProps()}
            className={`
              relative p-12 border-2 border-dashed rounded-lg text-center
              transition-all duration-300 ease-in-out
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg
                  className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
                {isDragActive ? (
                  <p>Release to upload...</p>
                ) : (
                  <p>Drag and drop image folder here</p>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to select folder
              </p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Supported formats: JPG, PNG, GIF
          </div>
        </div>
      </div>
    </div>
  );
}
