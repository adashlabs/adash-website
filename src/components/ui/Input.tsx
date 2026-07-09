import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, helperText, ...props }, ref) => {
    const errorStyles = error ? 'border-destructive focus:ring-destructive focus:border-destructive' : 'border-input focus:ring-ring focus:border-primary';
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        ) : null}
        <input
          type={type}
          ref={ref}
          className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${errorStyles} ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-destructive font-medium animate-in fade-in duration-200">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-muted-foreground">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
