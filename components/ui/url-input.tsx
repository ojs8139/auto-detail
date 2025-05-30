"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isValidUrl } from "@/lib/assets";

interface UrlInputProps {
  initialValue?: string;
  onSave: (url: string) => void;
  className?: string;
  placeholder?: string;
}

export function UrlInput({
  initialValue = "",
  onSave,
  className = "",
  placeholder = "https://example.com",
}: UrlInputProps) {
  const [url, setUrl] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(!initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const handleSave = () => {
    if (!url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    if (!isValidUrl(url)) {
      setError("유효한 URL 형식이 아닙니다.");
      return;
    }

    onSave(url);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        ) : (
          <div className="flex-1 border rounded-md p-2 text-sm">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {url}
            </a>
          </div>
        )}

        <Button
          type="button"
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? "저장" : "편집"}
        </Button>

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUrl("");
              setIsEditing(true);
            }}
          >
            삭제
          </Button>
        )}
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
} 