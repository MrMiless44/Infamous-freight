import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`rounded-2xl bg-crimson-900 px-5 py-3 text-sm font-semibold shadow-float transition duration-base ease-premium hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
