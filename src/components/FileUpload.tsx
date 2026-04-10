import { useCallback, useState } from 'react';

const VALID_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!VALID_TYPES.has(file.type)) {
        alert('Please upload a PDF or image file (PNG, JPG, WebP)');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert('File size must be under 20MB');
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div
      className={`file-upload ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-input"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={handleChange}
        disabled={isProcessing}
      />
      <label htmlFor="file-input" className="file-upload-label">
        {isProcessing ? (
          <>
            <div className="spinner" />
            <p>Processing document with AI...</p>
          </>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <p>
              <strong>Drop invoice here</strong> or click to browse
            </p>
            <span className="file-types">PDF, PNG, JPG, WebP — max 20MB</span>
            {fileName && <span className="file-name">Selected: {fileName}</span>}
          </>
        )}
      </label>
    </div>
  );
}
