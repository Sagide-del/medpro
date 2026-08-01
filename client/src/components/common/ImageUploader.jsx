import { useMemo, useRef } from 'react';

function toList(value) {
  if (!Array.isArray(value)) return [];
  return value;
}

export default function ImageUploader({
  label = 'Images',
  helper = '',
  images = [],
  onChange,
  accept = 'image/png,image/jpeg,image/gif,image/webp',
  multiple = true,
}) {
  const inputRef = useRef(null);
  const list = useMemo(() => toList(images), [images]);

  function openPicker() {
    inputRef.current?.click();
  }

  function updateImage(index, field, value) {
    const next = list.map((image, currentIndex) => (currentIndex === index ? { ...image, [field]: value } : image));
    onChange?.(next);
  }

  function removeImage(index) {
    onChange?.(list.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = [
      ...list,
      ...files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        caption: file.name,
        altText: '',
      })),
    ];
    onChange?.(next);
    event.target.value = '';
  }

  return (
    <div className="image-uploader">
      <div className="section-head">
        <div>
          <h2>{label}</h2>
          {helper ? <p>{helper}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFiles}
        className="image-uploader-input"
      />

      <button type="button" className="ghost" onClick={openPicker}>
        Add image(s)
      </button>

      <div className="image-uploader-grid">
        {list.map((image, index) => (
          <div className="image-uploader-item" key={`${image.url || image.caption}-${index}`}>
            <img src={image.url} alt={image.altText || image.caption || `Upload ${index + 1}`} />
            <div className="field">
              <label>Caption</label>
              <input
                value={image.caption || ''}
                onChange={(event) => updateImage(index, 'caption', event.target.value)}
                placeholder="Caption"
              />
            </div>
            <div className="field">
              <label>Alt text</label>
              <input
                value={image.altText || ''}
                onChange={(event) => updateImage(index, 'altText', event.target.value)}
                placeholder="Alt text"
              />
            </div>
            <div className="image-uploader-actions">
              <button type="button" className="ghost danger" onClick={() => removeImage(index)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
