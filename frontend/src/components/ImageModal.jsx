import { useState, useEffect } from 'react';
import './ImageModal.css';

export default function ImageModal({ src, alt, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (src) {
      setIsClosing(false);
    }
  }, [src]);

  if (!src) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  return (
    <div 
      className={`image-modal-backdrop ${isClosing ? 'closing' : ''}`} 
      onClick={handleClose}
    >
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="image-modal-image" />
      </div>
      <button className="image-modal-close" onClick={handleClose}>&times;</button>
    </div>
  );
}
