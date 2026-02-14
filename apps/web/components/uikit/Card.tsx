/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Card Component
 */

import React, { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'bordered';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  icon,
  onClick,
  interactive = false,
  variant = 'default',
  className = '',
}) => {
  return (
    <div
      className={`
        ${styles.card}
        ${styles[variant]}
        ${interactive ? styles.interactive : ''}
        ${className}
      `}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default Card;
