"use client";

import { useState, useEffect, useRef } from "react";

interface FicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackType?: "cover" | "avatar" | "banner" | "general";
}

export function FicImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackType = "general",
  ...props
}: FicImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Comprobar si la imagen ya está en caché del navegador al montar o cambiar de URL
  useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      return;
    }

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      setHasError(false);
    } else {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${containerClassName}`}
      style={{ background: "var(--bg-card-secondary)" }}
    >
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. SKELETON SHIMMER LIMPIO SIN ICONOS (Solo mientras carga)     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {!isLoaded && !hasError && src && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center animate-pulse"
          style={{ background: "var(--bg-card-secondary)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. ESTADO DE ERROR O SIN IMAGEN (Degradado puro y elegante)    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {(!src || hasError) && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: "var(--bg-card-secondary)" }}
        >
          {fallbackType === "avatar" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/default-avatar.svg" alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full opacity-30" />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 3. IMAGEN REAL                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {src && !hasError && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="eager"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...props}
        />
      )}

    </div>
  );
}
