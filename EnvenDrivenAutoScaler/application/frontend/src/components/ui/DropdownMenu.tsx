// components/ui/DropdownMenu.tsx
import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  asChild = false 
}) => {
  const { open, setOpen } = useContext(DropdownMenuContext)!;

  const handleTrigger = () => {
    setOpen(!open);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleTrigger,
    });
  }

  return (
    <button onClick={handleTrigger}>
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  align = 'center',
  className 
}) => {
  const { open } = useContext(DropdownMenuContext)!;

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div className={cn(
      'absolute z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onClick,
  className 
}) => {
  const { setOpen } = useContext(DropdownMenuContext)!;

  const handleClick = () => {
    if (onClick) onClick();
    setOpen(false);
  };

  return (
    <button
      className={cn(
        'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      'px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100',
      className
    )}>
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
  );
};