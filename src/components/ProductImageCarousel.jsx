import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function ProductImageCarousel({
  images = [],
  alt = 'Producto',
  fallbackClassName = 'bg-gradient-to-br from-brand-ink to-brand-inkLight',
  className = 'h-40',
  iconClassName = 'h-8 w-8',
  imageClassName = 'group-hover:scale-105',
}) {
  const imageUrls = Array.isArray(images) ? images.filter(Boolean) : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = imageUrls[activeIndex] ?? null;
  const hasMultipleImages = imageUrls.length > 1;

  const goTo = (event, direction) => {
    event.stopPropagation();
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return imageUrls.length - 1;
      if (next >= imageUrls.length) return 0;
      return next;
    });
  };

  return (
    <div className={`relative overflow-hidden ${className} ${activeImage ? '' : fallbackClassName}`}>
      {activeImage ? (
        <img
          src={activeImage}
          alt={alt}
          className={`h-full w-full object-cover transition-transform duration-500 ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-white shadow-lg">
            <Package className={iconClassName} />
          </div>
        </div>
      )}

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={(event) => goTo(event, -1)}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-sm transition hover:bg-white"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => goTo(event, 1)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-sm transition hover:bg-white"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {imageUrls.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`}
                aria-label={`Ver imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
