import { useEffect, useState } from 'react';

interface FilePreviewProps {
  file: File;
  isProcessing: boolean;
  onConfirm: () => void;
  onReupload: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ file, isProcessing, onConfirm, onReupload }: FilePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="file-preview">
      <h3 className="file-preview-title">Review Selected File</h3>
      <p className="file-preview-subtitle">Confirm this is the correct invoice before sending to AI for extraction.</p>

      {/* Full document preview */}
      <div className="file-preview-viewer">
        {isImage && objectUrl ? (
          <img src={objectUrl} alt="Invoice preview" className="file-preview-full-image" />
        ) : isPDF && objectUrl ? (
          <iframe
            src={objectUrl}
            title="PDF preview"
            className="file-preview-pdf-embed"
          />
        ) : (
          <div className="file-preview-unsupported">
            <span className="file-preview-unsupported-icon">📎</span>
            <span>Preview not available for this file type</span>
          </div>
        )}
      </div>

      {/* File metadata */}
      <div className="file-preview-info">
        <span className="file-preview-info-name">{file.name}</span>
        <span className="file-preview-info-detail">{file.type || 'Unknown type'}</span>
        <span className="file-preview-info-detail">{formatFileSize(file.size)}</span>
      </div>

      <div className="file-preview-actions">
        <button className="btn btn-secondary" onClick={onReupload} disabled={isProcessing}>
          ← Re-upload Different File
        </button>
        <button className="btn btn-primary" onClick={onConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <span className="spinner spinner-sm" /> Extracting…
            </>
          ) : (
            'Extract Invoice Data →'
          )}
        </button>
      </div>
    </div>
  );
}
