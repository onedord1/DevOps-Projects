// Card.tsx - Enhanced version
import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  children, 
  variant = 'default',
  hoverable = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-300',
        variant === 'default' && 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        variant === 'outlined' && 'border-2 border-gray-200 bg-transparent dark:border-gray-700',
        variant === 'elevated' && 'border-0 bg-white shadow-md dark:bg-gray-800',
        hoverable && 'hover:shadow-lg cursor-pointer',
        isHovered && hoverable && 'transform -translate-y-1',
        className
      )}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className, children }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ className, children }) => {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100', className)}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ className, children }) => {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className, children }) => {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  );
};