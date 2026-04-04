interface TimelineStep {
  label: string;
  time?: string;
  completed: boolean;
  active?: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export default function Timeline({ steps }: TimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        let dotClasses: string;
        let lineClasses: string;
        let labelClasses: string;

        if (step.completed) {
          dotClasses = 'bg-emerald-500 border-emerald-500/30';
          lineClasses = 'bg-emerald-500/40';
          labelClasses = 'text-slate-200';
        } else if (step.active) {
          dotClasses = 'bg-blue-500 border-blue-500/30 ring-4 ring-blue-500/20';
          lineClasses = 'bg-slate-700';
          labelClasses = 'text-blue-400 font-semibold';
        } else {
          dotClasses = 'bg-slate-700 border-slate-600';
          lineClasses = 'bg-slate-700';
          labelClasses = 'text-slate-500';
        }

        return (
          <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[9px] top-5 h-full w-0.5 ${lineClasses}`}
              />
            )}

            {/* Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`h-[20px] w-[20px] rounded-full border-2 ${dotClasses} flex items-center justify-center`}
              >
                {step.completed && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2.5 5l2 2 3.5-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <p className={`text-sm ${labelClasses}`}>{step.label}</p>
              {step.time && (
                <p className="mt-0.5 text-xs text-slate-500">{step.time}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
