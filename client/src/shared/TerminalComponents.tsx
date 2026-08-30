import * as React from 'react';

// TerminalButton (Newsprint Style)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'muted';
  children: React.ReactNode;
}

export const TerminalButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const colorMap = {
    primary: 'bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111]',
    secondary: 'border border-[#111111] bg-[#F9F9F7] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]',
    error: 'bg-[#CC0000] text-[#F9F9F7] border border-[#CC0000] hover:bg-[#111111] hover:border-[#111111]',
    muted: 'border border-[#111111]/30 bg-[#F9F9F7] text-[#525252] hover:bg-[#E5E5E0] hover:text-[#111111] hover:border-[#111111]'
  };

  return (
    <button
      className={`font-sans text-xs font-bold uppercase tracking-widest px-4 py-2.5 transition-all duration-150 active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 ${colorMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// TerminalCard (Newsprint Style)
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  borderColor?: 'primary' | 'secondary' | 'error' | 'muted';
}

export const TerminalCard: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  borderColor = 'primary'
}) => {
  const badgeStyles = {
    primary: 'bg-[#111111] text-[#F9F9F7]',
    secondary: 'bg-[#E5E5E0] text-[#111111] border border-[#111111]',
    error: 'bg-[#CC0000] text-white',
    muted: 'border border-[#111111] text-[#525252]'
  };

  return (
    <div className={`bg-[#F9F9F7] border border-[#111111] p-5 font-body hard-shadow-hover ${className}`}>
      <div className="border-b border-[#111111] pb-2 mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-[#111111] tracking-tight uppercase">
          {title}
        </h3>
        <span className={`text-[10px] font-sans font-extrabold uppercase px-2 py-0.5 tracking-widest ${badgeStyles[borderColor]}`}>
          EDITION
        </span>
      </div>
      <div className="text-xs text-[#111111]">
        {children}
      </div>
    </div>
  );
};

// TerminalInput (Newsprint Style)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  prefix?: string;
  isSelect?: boolean;
  children?: React.ReactNode;
}

export const TerminalInput: React.FC<InputProps> = ({
  label,
  prefix,
  isSelect = false,
  children,
  className = '',
  ...props
}) => {
  const commonClasses = `bg-transparent w-full outline-none border-none text-[#111111] font-mono text-sm placeholder-[#737373] ${className}`;
  return (
    <div className="font-sans text-xs text-[#111111] w-full">
      {label && <label className="block mb-1.5 font-bold uppercase tracking-wider text-[11px] text-[#111111]">{label}</label>}
      <div className="flex items-center gap-2 bg-[#F9F9F7] border-b-2 border-[#111111] px-3 py-2.5 text-[#111111] focus-within:bg-[#F0F0F0]">
        {prefix && <span className="text-[#737373] text-xs font-mono shrink-0 select-none">{prefix}</span>}
        {isSelect ? (
          <select 
            className={`${commonClasses} bg-transparent cursor-pointer`}
            {...(props as any)}
          >
            {children}
          </select>
        ) : (
          <input
            className={commonClasses}
            {...(props as any)}
          />
        )}
      </div>
    </div>
  );
};

// StatBar (Newsprint Style)
interface StatBarProps {
  label: string;
  percentage: number;
  maxChars?: number;
  variant?: 'primary' | 'secondary' | 'error';
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  percentage,
  maxChars = 15,
  variant = 'primary'
}) => {
  const roundedPercent = Math.min(100, Math.max(0, Math.round(percentage)));
  
  return (
    <div className="font-sans text-xs py-1 w-full text-[#111111]">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold uppercase tracking-wider text-[10px] text-[#111111] truncate">{label}</span>
        <span className="font-mono font-bold text-xs">{roundedPercent}%</span>
      </div>
      <div className="w-full bg-[#E5E5E0] h-2.5 border border-[#111111] relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            variant === 'error' ? 'bg-[#CC0000]' : 'bg-[#111111]'
          }`}
          style={{ width: `${roundedPercent}%` }}
        />
      </div>
    </div>
  );
};

// StatusTag (Newsprint Style)
interface StatusTagProps {
  status: 'ok' | 'err' | 'locked' | 'warn' | 'info';
  className?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, className = '' }) => {
  const statusConfig = {
    ok: { text: 'PASSED', color: 'bg-[#111111] text-[#F9F9F7]' },
    err: { text: 'ALERT', color: 'bg-[#CC0000] text-white font-bold' },
    locked: { text: 'LOCKED', color: 'bg-[#E5E5E0] text-[#737373] border border-[#111111]' },
    warn: { text: 'PENDING', color: 'border border-[#111111] bg-[#F9F9F7] text-[#111111]' },
    info: { text: 'NOTICE', color: 'bg-[#E5E5E0] text-[#111111]' }
  };

  const { text, color } = statusConfig[status] || statusConfig.info;
  return (
    <span className={`font-sans text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 inline-block ${color} ${className}`}>
      {text}
    </span>
  );
};

