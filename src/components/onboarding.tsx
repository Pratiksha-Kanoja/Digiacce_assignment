"use client";

type OnboardingProps = {
  onStart: () => void;
};

export function Onboarding({ onStart }: OnboardingProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white md:flex-row">
      <div className="relative h-[56dvh] min-h-[280px] overflow-hidden bg-primary md:h-auto md:min-h-dvh md:w-[46%]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 520" fill="none" aria-hidden>
          <path
            d="M-30 70c36 28 58-22 104-4 42 16 48 42 92 28 40-12 52-40 96-22 38 16 70 8 128-18"
            stroke="white"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
          <path
            d="M-30 118c40 24 62-26 108 0 40 22 54 36 98 16 42-18 60-42 104-18 36 20 62 14 120-8"
            stroke="white"
            strokeOpacity="0.28"
            strokeWidth="2"
          />
          <path
            d="M-20 168c48 18 70-30 116-6 44 22 50 40 96 18"
            stroke="white"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          <path
            d="M-40 360c50 30 80-24 130-2 46 20 62 38 110 14 44-22 70-36 120-10 40 20 70 8 110-16"
            stroke="white"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          <path
            d="M-20 410c46 26 74-20 122 2 48 22 58 34 108 10 42-20 78-28 130-4"
            stroke="white"
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <circle cx="330" cy="64" r="46" stroke="white" strokeOpacity="0.18" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:justify-center md:px-16 md:py-16 lg:px-24">
        <p className="hidden text-sm font-semibold tracking-wide text-primary uppercase md:block">To Do List</p>
        <h1 className="max-w-[240px] text-[28px] font-bold leading-[1.2] tracking-tight text-ink md:mt-4 md:max-w-xl md:text-5xl md:leading-[1.15] lg:text-6xl">
          Manage What To Do
        </h1>
        <p className="mt-3 max-w-[250px] text-sm leading-6 text-muted md:mt-5 md:max-w-md md:text-lg md:leading-8">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-auto h-12 w-full rounded-xl bg-primary text-base font-semibold text-white md:mt-10 md:w-fit md:px-12"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
