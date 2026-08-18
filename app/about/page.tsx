import { Card, CardBody, CardHeader } from "@/components/ui/card";
import numpyOutput from "../../public/python-output/numpy-output.json";

type NumpyOutput = typeof numpyOutput;

const output = numpyOutput as NumpyOutput;

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
          About Project
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-background">
          Python fundamentals behind the NumPy analysis
        </h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          This page explains the small Python pipeline that prepares the offline NumPy output used by the app.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {output.concepts.map((concept) => (
          <Card key={concept.name}>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                {concept.name}
              </p>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-on-surface-variant">{concept.description}</p>
              <pre className="overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-low p-4 font-mono text-sm leading-6 text-on-background">
                {concept.snippet.join("\n")}
              </pre>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

