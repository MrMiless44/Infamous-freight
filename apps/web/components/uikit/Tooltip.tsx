/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Tooltip Component
 */

import React, { ReactNode, useState } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "right" | "bottom" | "left";
  delay?: number;
  maxWidth?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 0,
  maxWidth = 200,
}) => {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setVisible(true), delay);
    setTimeoutId(timeout);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setVisible(false);
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.trigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>
      {visible && (
        <div
          className={`${styles.tooltip} ${styles[position]}`}
          role="tooltip"
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {content}
          <div className={styles.arrow} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
