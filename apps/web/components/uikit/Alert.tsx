/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Alert Component
 */

import React, { ReactNode } from "react";
import styles from "./Alert.module.css";

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  icon?: ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultIcons = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export const Alert: React.FC<AlertProps> = ({ type, title, message, icon, onClose, action }) => {
  return (
    <div
      className={`${styles.alert} ${styles[type]}`}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className={styles.iconWrapper}>
        {icon || <span className={styles.icon}>{defaultIcons[type]}</span>}
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <div className={styles.actions}>
        {action && (
          <button
            className={styles.actionButton}
            onClick={action.onClick}
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Close alert">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
