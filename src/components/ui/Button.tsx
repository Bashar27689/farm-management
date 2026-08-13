// src/components/ui/Button.tsx
'use client';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'alert' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group';
  
  const variantStyles = {
    primary: `text-white`,
    secondary: `text-white`,
    alert: `text-white`,
    outline: `bg-transparent border-2`,
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const getVariantColor = () => {
    switch(variant) {
      case 'primary':
        return { bg: '#2E7D32', hover: '#1B5E20' };
      case 'secondary':
        return { bg: '#374151', hover: '#1F2937' };
      case 'alert':
        return { bg: '#EF6C00', hover: '#E65100' };
      case 'outline':
        return { bg: 'transparent', hover: 'transparent' };
    }
  };

  const colors = getVariantColor();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={{
        backgroundColor: variant === 'outline' ? 'transparent' : colors.bg,
        borderColor: variant === 'outline' ? '#2E7D32' : 'transparent',
        color: variant === 'outline' ? '#2E7D32' : '#FFFFFF',
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </span>
      {variant !== 'outline' && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
          style={{ backgroundColor: variant === 'alert' ? '#2E7D32' : '#EF6C00' }}
        />
      )}
      {variant === 'outline' && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
          style={{ backgroundColor: '#2E7D32' }}
        />
      )}
    </button>
  );
}