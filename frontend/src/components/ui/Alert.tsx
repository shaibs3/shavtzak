import { ReactNode } from 'react';
import clsx from 'clsx';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
  children: ReactNode;
}

export function Alert({ variant = 'info', className, children }: AlertProps) {
  return (
    <div
      className={clsx(
        'rounded-md p-4',
        {
          'bg-blue-50 border border-blue-200': variant === 'info',
          'bg-green-50 border border-green-200': variant === 'success',
          'bg-yellow-50 border border-yellow-200': variant === 'warning',
          'bg-red-50 border border-red-200': variant === 'error',
        },
        className
      )}
    >
      <div
        className={clsx('text-sm', {
          'text-blue-800': variant === 'info',
          'text-green-800': variant === 'success',
          'text-yellow-800': variant === 'warning',
          'text-red-800': variant === 'error',
        })}
      >
        {children}
      </div>
    </div>
  );
}
