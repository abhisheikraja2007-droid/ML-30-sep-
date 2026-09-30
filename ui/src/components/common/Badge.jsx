import React from 'react';

export function Badge({ variant = 'default', children, className = '', size = 'md' }) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors select-none font-sans';

  const sizes = {
    sm: 'px-2.5 py-1 text-xs tracking-wide',
    md: 'px-3 py-1.5 text-sm tracking-wide font-semibold'
  };

  const variants = {
    default: 'bg-[#E9E2D5] text-[#252522] border-[#C7C0B4]',
    primary: 'bg-[#F1EBDD] text-[#343430] border-[#C6A15B]',
    success: 'bg-[#DCE5D7] text-[#58704F] border-[#A4B89D]',
    warning: 'bg-[#F1E4C9] text-[#A8782E] border-[#D8C18A]',
    error: 'bg-[#F0DCD7] text-[#A34B40] border-[#CFA8A0]',
    s1: 'bg-[#E6E0D4] text-[#252522] border-[#C7C0B4] font-mono font-bold',
    s2: 'bg-[#F1EBDD] text-[#5E513F] border-[#D8C18A] font-mono font-bold',
    s3: 'bg-[#E9E2D5] text-[#8A6545] border-[#B8B2A5] font-mono font-bold'
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

