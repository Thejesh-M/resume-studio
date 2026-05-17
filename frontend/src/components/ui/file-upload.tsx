"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES } from "@/lib/constants";

interface FileUploadProps {
  readonly onFileSelect: (file: File) => void;
  readonly accept?: readonly string[];
  readonly maxSizeMb?: number;
  readonly disabled?: boolean;
  readonly className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() ?? "";
}

export function FileUpload({
  onFileSelect,
  accept = ACCEPTED_FILE_TYPES,
  maxSizeMb = MAX_FILE_SIZE_MB,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (accept.length > 0 && !accept.includes(file.type)) {
        return "Invalid file type. Please upload a PDF or DOCX file.";
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        return `File too large. Maximum size is ${maxSizeMb}MB.`;
      }
      return null;
    },
    [accept, maxSizeMb]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleRemove() {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        id={inputId}
      />

      {selectedFile ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
          <FileText className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {getFileExtension(selectedFile.name)} &middot;{" "}
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drop your resume here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or DOCX, up to {maxSizeMb}MB
            </p>
          </div>
        </label>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
