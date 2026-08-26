import React from 'react';

export interface LogoProps {
  className?: string;
  variant?: 'icon' | 'full';
  showSubtitle?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Icono Vectorial Oficial de PerioDash
 * Representa la muela anatómica estilizada con curvas de crecimiento aerodinámicas,
 * flechas ascendentes de avance y cruz médica/clínica.
 */
export function PerioDashIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs transition-transform duration-300 ${className}`}
    >
      <defs>
        {/* Gradiente Teal/Emerald principal */}
        <linearGradient id="perioTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="45%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>

        {/* Gradiente Azul profundo / Cyan */}
        <linearGradient id="perioBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Gradiente de flechas ascendentes */}
        <linearGradient id="perioArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="50%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>

        {/* Gradiente de ala/órbita inferior */}
        <linearGradient id="perioSwooshGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0891B2" />
          <stop offset="50%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Silueta y contorno anatómico del Diente / Molar estilizado */}
      <path
        d="M 28 35 
           C 24 22, 38 15, 50 20 
           C 62 15, 76 22, 72 35 
           C 70 42, 66 52, 68 70 
           C 69 77, 62 82, 57 74 
           C 53 67, 51 63, 50 63 
           C 49 63, 47 67, 43 74 
           C 38 82, 31 77, 32 70 
           C 34 52, 30 42, 28 35 Z"
        stroke="url(#perioTealGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="url(#perioTealGrad)"
        fillOpacity="0.08"
      />

      {/* Cruces clínicas / médicas en la cúspide izquierda */}
      <g fill="#2DD4BF" opacity="0.95">
        <path d="M 38 27 h 4 v 4 h -4 v 4 h -4 v -4 h -4 v -4 h 4 v -4 h 4 z" transform="scale(0.8) translate(8, 6)" />
        <path d="M 44 38 h 3 v 3 h -3 v 3 h -3 v -3 h -3 v -3 h 3 v -3 h 3 z" transform="scale(0.6) translate(26, 20)" opacity="0.75" />
      </g>

      {/* Órbita aerodinámica inferior envolvente */}
      <path
        d="M 12 55 
           C 14 70, 32 86, 56 86 
           C 72 86, 84 76, 88 64 
           C 85 64, 76 74, 56 74 
           C 36 74, 22 64, 18 53 Z"
        fill="url(#perioSwooshGrad)"
      />

      {/* Flecha dinámica superior diagonal hacia el éxito clínico */}
      <path
        d="M 28 64 
           C 38 58, 60 48, 76 26"
        stroke="url(#perioArrowGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Punta de flecha superior */}
      <path
        d="M 68 22 L 85 22 L 80 38 Z"
        fill="url(#perioArrowGrad)"
      />

      {/* Flecha dinámica inferior paralela */}
      <path
        d="M 24 74 
           C 36 70, 58 64, 72 46"
        stroke="url(#perioArrowGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Punta de flecha inferior */}
      <path
        d="M 66 43 L 78 43 L 74 54 Z"
        fill="url(#perioArrowGrad)"
      />
    </svg>
  );
}

/**
 * Logotipo Principal de PerioDash
 * Adaptado con la tipografía oficial geométrica moderna, el isotipo con flechas de avance
 * y el descriptor "SOFTWARE ODONTOLÓGICO PROFESIONAL".
 */
export default function Logo({
  className = "",
  variant = "full",
  showSubtitle = true,
  subtitle = "SOFTWARE ODONTOLÓGICO PROFESIONAL",
  size = "md"
}: LogoProps) {
  const sizeMap = {
    sm: {
      icon: "w-7 h-7",
      title: "text-base",
      subtitle: "text-[7.5px]",
      arrow: "w-3 h-3"
    },
    md: {
      icon: "w-9 h-9 sm:w-10 sm:h-10",
      title: "text-xl sm:text-2xl",
      subtitle: "text-[9px] sm:text-[10px]",
      arrow: "w-4 h-4"
    },
    lg: {
      icon: "w-14 h-14",
      title: "text-3xl sm:text-4xl",
      subtitle: "text-xs tracking-widest",
      arrow: "w-6 h-6"
    },
    xl: {
      icon: "w-20 h-20",
      title: "text-5xl",
      subtitle: "text-sm tracking-widest",
      arrow: "w-8 h-8"
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <PerioDashIcon className={currentSize.icon} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Isotipo */}
      <PerioDashIcon className={currentSize.icon} />

      {/* Bloque Tipográfico Oficial */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center">
          <span className="font-display font-black tracking-tight text-[#0F3B5F] dark:text-[#38BDF8]">
            PERIO
          </span>
          {/* Letra D con flecha interna estilizada integrada */}
          <span className="font-display font-black tracking-tight text-[#0D9488] dark:text-[#2DD4BF] flex items-center">
            D
            <span className="relative inline-flex items-center justify-center mx-[0.5px]">
              A
              {/* Sutil flecha sobre el travesaño de la A como en el logo oficial */}
              <svg 
                viewBox="0 0 20 10" 
                className="absolute inset-0 w-full h-full text-[#14B8A6] dark:text-[#2DD4BF] opacity-80 pointer-events-none"
                fill="currentColor"
              >
                <path d="M2 6 C6 4, 12 3, 16 3 M14 1 L18 3 L14 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            SH
          </span>
        </div>

        {showSubtitle && (
          <span className={`font-sans font-bold tracking-[0.14em] uppercase text-[#0891B2] dark:text-[#5EEAD4] mt-1 ${currentSize.subtitle}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
