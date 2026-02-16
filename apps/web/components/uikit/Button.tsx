/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User-Friendly Button Component
 *
 * Accessible, responsive, intuitive button with built-in states
 */

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      disabled = false,
      tooltip,
      ariaLabel,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`
          ${styles.button}
          ${styles[variant]}
          ${styles[size]}
          ${fullWidth ? styles.fullWidth : ""}
          ${isDisabled ? styles.disabled : ""}
          ${className}
        `}
        disabled={isDisabled}
        aria-label={ariaLabel || tooltip}
        title={tooltip}
        {...props}
      >
        {loading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.loadingText}>{children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
