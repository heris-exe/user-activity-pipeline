import type { PipelineStage } from "@/lib/types";

interface PipelineStripProps {
  stages: PipelineStage[];
}

export function PipelineStrip({ stages }: PipelineStripProps) {
  return (
    <section className="rounded-[14px] border border-[var(--line)] bg-[linear-gradient(180deg,#fffdf6,#efe7d1)] px-6 py-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-baseline lg:justify-between">
        <h3 className="font-display text-[1.45rem] font-normal tracking-[-0.02em] text-[var(--ink)]">
          How this page is built{" "}
          <em className="font-light italic text-[var(--muted)]">
            {"\u2014"} an engineered pipeline, not hand-made charts.
          </em>
        </h3>
        <div className="font-mono-ui text-[0.68rem] text-[var(--muted)]">
          latency: snapshot export
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-5">
        {stages.map((stage, index) => (
          <article
            key={stage.id}
            className="relative border-r-0 border-[var(--line)] px-4 py-4 xl:border-r xl:border-dashed xl:last:border-r-0"
          >
            <div
              className={`mb-3 grid h-[34px] w-[34px] place-items-center rounded-[8px] font-mono-ui text-[0.72rem] font-semibold ${
                index === 2
                  ? "bg-[var(--flame)] text-white"
                  : "bg-[var(--ink)] text-[var(--accent)]"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
              {stage.id}
            </div>
            <div className="mt-2 font-display text-[1rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
              {stage.label}
            </div>
            <div className="mt-1 font-mono-ui text-[0.68rem] text-[var(--muted)]">
              {stage.detail}
            </div>

            {index < stages.length - 1 ? (
              <div className="pointer-events-none absolute -right-[8px] top-1/2 hidden -translate-y-1/2 bg-[var(--paper)] px-1 font-mono-ui text-base text-[var(--muted)] xl:block">
                {"\u2192"}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
