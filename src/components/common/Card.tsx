import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-aviation-border shadow-subtle ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-aviation-border">
          <div>
            {title && <h3 className="font-semibold text-aviation-navy text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-aviation-textSecondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

