/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Interactive Onboarding System
 * 
 * Guides new users through essential platform features
 */

import React, { ReactNode, useEffect, useState } from 'react';
import styles from './Onboarding.module.css';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  image?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export interface OnboardingProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={styles.container}>
      {/* Highlight overlay */}
      {highlightedElement && (
        <div
          className={styles.highlight}
          style={{
            top: highlightedElement.getBoundingClientRect().top,
            left: highlightedElement.getBoundingClientRect().left,
            width: highlightedElement.getBoundingClientRect().width,
            height: highlightedElement.getBoundingClientRect().height,
          }}
        />
      )}

      {/* Spotlight backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Onboarding card */}
      <div className={styles.card} role="dialog" aria-label="Onboarding guide">
        {step.image && (
          <div className={styles.imageContainer}>
            <img src={step.image} alt={step.title} />
          </div>
        )}

        <div className={styles.content}>
          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.description}</p>

          {step.actions && (
            <div className={styles.actions}>
              {step.actions.map((action, idx) => (
                <button
                  key={idx}
                  className={styles.actionButton}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.counter}>
            {currentStep + 1} of {steps.length}
          </span>

          <div className={styles.controls}>
            <button
              className={styles.secondaryButton}
              onClick={handlePrevious}
              disabled={currentStep === 0}
              aria-label="Previous step"
            >
              ← Previous
            </button>

            <button
              className={styles.skip}
              onClick={handleComplete}
              aria-label="Skip onboarding"
            >
              Skip
            </button>

            <button
              className={styles.primaryButton}
              onClick={handleNext}
              aria-label={currentStep === steps.length - 1 ? 'Complete' : 'Next step'}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
