import { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps {
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
  children: ReactNode;
}

export function Badge({ color = 'gray', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': color === 'gray',
          'bg-blue-100 text-blue-800': color === 'blue',
          'bg-green-100 text-green-800': color === 'green',
          'bg-yellow-100 text-yellow-800': color === 'yellow',
          'bg-red-100 text-red-800': color === 'red',
          'bg-purple-100 text-purple-800': color === 'purple',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
