import React, { createContext, useContext, ReactNode } from 'react';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  children, 
  value, 
  onValueChange,
  className = ''
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ 
  children,
  className = ''
}) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  icon?: ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  value,
  icon,
  className = ''
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }
  
  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`
        flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-px
        ${isSelected 
          ? 'border-primary-500 text-primary-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        ${className}
      `}
    >
      {icon && icon}
      {children}
    </button>
  );
};

interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  children, 
  value,
  className = ''
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }
  
  const { value: selectedValue } = context;
  
  if (selectedValue !== value) {
    return null;
  }
  
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
