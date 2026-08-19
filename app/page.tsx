"use client";

import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div>
      <section className="relative min-h-[min(92vh,820px)] overflow-hidden hero-photo">
        <div className="absolute inset-0 hero-grid opacity-40" aria-hidden />
        <div className="relative mx-auto flex min-h-[min(92vh,820px)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:py-20">
          <p className="animate-fade-up font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("brand")}
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-2xl text-xl font-semibold leading-snug text-white/95 sm:text-2xl md:text-3xl">
            {t("landing.headline")}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            {t("landing.subhead")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-3xl font-bold text-navy-900 sm:text-4xl">
          {t("landing.howTitle")}
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            { title: t("landing.how1Title"), body: t("landing.how1Body"), n: "01" },
            { title: t("landing.how2Title"), body: t("landing.how2Body"), n: "02" },
            { title: t("landing.how3Title"), body: t("landing.how3Body"), n: "03" },
          ].map((step) => (
            <li key={step.n} className="relative">
              <span className="font-display text-4xl font-extrabold text-accent-500/90">
                {step.n}
              </span>
              <h3 className="mt-3 text-xl font-bold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-600 sm:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-3xl font-bold text-navy-900">
          {t("landing.servicesTitle")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-navy-900 px-6 py-8 text-white">
            <p className="font-display text-2xl font-bold">{t("landing.painting")}</p>
          </div>
          <div className="rounded-2xl bg-steel-100 px-6 py-8 text-navy-900">
            <p className="font-display text-2xl font-bold">{t("landing.roofing")}</p>
          </div>
          <div className="rounded-2xl bg-accent-500 px-6 py-8 text-white">
            <p className="font-display text-2xl font-bold">{t("landing.flooring")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
