import React from 'react';
import { WeightStatus, LuggageStatus, FlightStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'navy';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-[#E8F7F0] text-[#16A36A] border-[#C2EBDA]',
    warning: 'bg-[#FEF6E9] text-[#E99A25] border-[#FCE2B6]',
    danger: 'bg-[#FCEBEB] text-[#DC4545] border-[#F8C6C6]',
    info: 'bg-[#EAF3FC] text-[#2878D0] border-[#C5DFF8]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    navy: 'bg-[#17365D] text-white border-[#17365D]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const WeightStatusBadge: React.FC<{ status: WeightStatus }> = ({ status }) => {
  if (status === 'ACCEPTED') {
    return (
      <Badge variant="success">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
        Accepted
      </Badge>
    );
  }
  if (status === 'NEAR_LIMIT') {
    return (
      <Badge variant="warning">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E99A25]" />
        Near Limit
      </Badge>
    );
  }
  return (
    <Badge variant="danger">
      <span className="w-1.5 h-1.5 rounded-full bg-[#DC4545]" />
      Overweight
    </Badge>
  );
};

export const LuggageStatusBadge: React.FC<{ status: LuggageStatus }> = ({ status }) => {
  switch (status) {
    case 'SORTED':
      return <Badge variant="success">Sorted</Badge>;
    case 'IN_TRANSIT':
      return <Badge variant="info">In Conveyor</Badge>;
    case 'WEIGHED':
      return <Badge variant="info">Weighed</Badge>;
    case 'OVERWEIGHT':
      return <Badge variant="danger">Overweight Divert</Badge>;
    case 'MANUAL_INSPECTION':
    case 'REJECTED':
      return <Badge variant="danger">Security Inspection</Badge>;
    case 'REGISTERED':
    default:
      return <Badge variant="neutral">Pending Sort</Badge>;
  }
};

export const FlightStatusBadge: React.FC<{ status: FlightStatus }> = ({ status }) => {
  switch (status) {
    case 'Boarding':
      return <Badge variant="success">Boarding</Badge>;
    case 'Scheduled':
      return <Badge variant="info">Scheduled</Badge>;
    case 'Departed':
      return <Badge variant="neutral">Departed</Badge>;
    case 'Delayed':
      return <Badge variant="warning">Delayed</Badge>;
    case 'Cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

