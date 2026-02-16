/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Empty State Component
 *
 * Shows helpful messages when there's no data, with actionable next steps
 */

import React, { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
  hint?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📭",
  title,
  description,
  action,
  illustration,
  hint,
}) => {
  return (
    <div className={styles.container}>
      {illustration && (
        <img src={illustration} alt="" className={styles.illustration} aria-hidden="true" />
      )}

      {typeof icon === "string" ? (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div className={styles.icon}>{icon}</div>
      )}

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      {action && (
        <button className={styles.actionButton} onClick={action.onClick}>
          {action.label}
        </button>
      )}

      {hint && <p className={styles.hint}>💡 {hint}</p>}
    </div>
  );
};

export default EmptyState;
