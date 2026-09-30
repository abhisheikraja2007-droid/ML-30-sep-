import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none font-sans';

  const variants = {
    primary: 'bg-[#252522] hover:bg-[#343430] text-[#F1EBDD] font-semibold border border-[#4A4A43] shadow-xs active:scale-[0.99]',
    secondary: 'bg-[#E9E2D5] hover:bg-[#E6E0D4] text-[#252522] border border-[#C7C0B4] font-semibold shadow-2xs active:scale-[0.99]',
    accent: 'bg-[#C6A15B] hover:bg-[#B5914C] text-[#252522] font-semibold border border-[#9E7B3F] shadow-xs active:scale-[0.99]',
    ghost: 'bg-transparent hover:bg-[#E9E2D5] text-[#252522] font-semibold',
    danger: 'bg-[#A34B40] hover:bg-[#8F3D33] text-[#F1EBDD] font-semibold shadow-2xs active:scale-[0.99]',
    outline: 'bg-transparent border border-[#AAA194] hover:bg-[#E9E2D5] text-[#252522] font-medium'
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-sm gap-2 min-h-[38px]',
    md: 'px-4 py-2.5 text-base gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-base font-semibold gap-2.5 min-h-[48px]'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

