import Link from "next/link";
import numpyOutput from "../../public/python-output/numpy-output.json";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { sampleRecords } from "@/lib/sample-data";
import { formatStatValue } from "@/lib/format";

type NumpyOutput = typeof numpyOutput;

export default function NumpyAnalysisPage() {
  const output = numpyOutput as NumpyOutput;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
          NumPy Analysis
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
          Offline NumPy output for the educational pipeline
        </h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          The production app uses TypeScript for live calculations. This page shows the same style of results
          produced by a standalone Python + NumPy script and stored as static JSON.
        </p>
      </section>

      <div className="space-y-5">
        {Object.entries(output.metrics).map(([key, metric]) => (
          <MetricBlock
            key={key}
            metric={metric}
            sampleCount={sampleRecords.length}
          />
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-on-background">Want the Python basics too?</h2>
            <p className="text-sm text-on-surface-variant">
              The About Project page walks through the Python fundamentals behind the offline generator.
            </p>
          </div>
          <Link href="/about" className="text-sm font-semibold text-primary">
            Open About Project
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

function MetricBlock({
  metric,
  sampleCount,
}: {
  metric: NumpyOutput["metrics"][keyof NumpyOutput["metrics"]];
  sampleCount: number;
}) {
  const labels = [
    ["Mean", metric.statistics.mean],
    ["Median", metric.statistics.median],
    ["Minimum", metric.statistics.min],
    ["Maximum", metric.statistics.max],
    ["Std Dev", metric.statistics.standardDeviation],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              {metric.label}
            </p>
            <h2 className="text-lg font-semibold text-on-background">NumPy {metric.label} summary</h2>
          </div>
          <div className="font-mono text-sm text-on-surface-variant">
            showing 10 of {sampleCount}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <pre className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-low p-4 font-mono text-sm leading-6 text-on-background">
{`${metric.label} Array
[${metric.sample.map((value) => value.toFixed(1)).join(", ")}, ...]`}
        </pre>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {labels.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                {label}
              </div>
              <div className="mt-2 text-2xl font-bold tracking-[-0.01em] text-on-background">
                {formatStatValue(value, 2)}
              </div>
              <div className="mt-1 text-sm text-on-surface-variant">{metric.unit}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 font-mono text-sm text-on-background">
          <div className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            How NumPy does this
          </div>
          <div className="mt-2">{metric.code}</div>
          <p className="mt-2 font-sans text-sm text-on-surface-variant">{metric.explanation}</p>
        </div>
      </CardBody>
    </Card>
  );
}

