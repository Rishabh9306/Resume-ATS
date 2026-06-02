'use client';

import { useState, useRef, useCallback } from 'react';

export default function FileUpload({
  onFileSelect,
  accept = '.pdf,.docx',
  maxSize = 5 * 1024 * 1024,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const acceptedTypes = accept.split(',').map((t) => t.trim());

  const validateFile = useCallback(
    (file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(ext)) {
        return `Invalid file type. Accepted: ${accept}`;
      }
      if (file.size > maxSize) {
        return `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
      }
      return null;
    },
    [accept, acceptedTypes, maxSize]
  );

  const handleFile = useCallback(
    (file) => {
      setError('');
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      onFileSelect?.(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback((e) => {
    e.stopPropagation(); // Avoid triggering file select
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelect?.(null);
  }, [onFileSelect]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (ext === 'docx' || ext === 'doc') return '📘';
    return '📄';
  };

  return (
    <div className="file-upload-wrapper">
      <div
        className={`file-upload ${isDragging ? 'file-upload--dragging' : ''} ${selectedFile ? 'file-upload--has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !selectedFile && fileInputRef.current?.click()}
        style={{ cursor: selectedFile ? 'default' : 'pointer' }}
      >
        {!selectedFile ? (
          <>
            <div className="file-upload__icon">
              {isDragging ? '📥' : '📤'}
            </div>
            <p className="file-upload__text">
              {isDragging ? 'Drop your resume here' : 'Drag & drop your resume here'}
            </p>
            {!isDragging && (
              <>
                <p className="file-upload__hint" style={{ marginTop: 'var(--space-xs)', color: 'var(--text-secondary)' }}>or click to browse</p>
                <p className="file-upload__hint" style={{ fontSize: 'var(--text-xs)' }}>PDF, DOCX up to 5MB</p>
              </>
            )}
          </>
        ) : (
          <div className="file-upload__selected-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <div className="file-upload__icon" style={{ opacity: 1, filter: 'drop-shadow(0 0 12px rgba(0,212,170,0.25))', margin: 0 }}>
              {getFileIcon(selectedFile.name)}
            </div>
            <p className="file-upload__text" style={{ color: 'var(--accent-secondary)', marginTop: 'var(--space-sm)' }}>
              {selectedFile.name}
            </p>
            <p className="file-upload__hint" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {formatSize(selectedFile.size)} • Ready for analysis
            </p>
            <button
              className="btn-secondary"
              onClick={handleRemove}
              style={{ marginTop: 'var(--space-md)', padding: '6px 16px', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ✕ Remove File
            </button>
          </div>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />
    </div>
  );
}
