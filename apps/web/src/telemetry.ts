import { context, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

import { LoggerProvider, BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";

const ENDPOINT = (
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318"
).replace(/\/$/, "");

const SERVICE_NAME = import.meta.env.VITE_OTEL_SERVICE_NAME ?? "podcast-web";

const resource = new Resource({
  [ATTR_SERVICE_NAME]: SERVICE_NAME,
  [ATTR_SERVICE_VERSION]: "0.1.0",
  "deployment.environment": import.meta.env.MODE ?? "production",
});

export function initTelemetry(): void {
  // ---- Traces --------------------------------------------------------------
  const tracerProvider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${ENDPOINT}/v1/traces` }),
      ),
    ],
  });
  tracerProvider.register({ contextManager: new ZoneContextManager() });

  // ---- Metrics -------------------------------------------------------------
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${ENDPOINT}/v1/metrics` }),
        exportIntervalMillis: 30000,
      }),
    ],
  });

  // ---- Logs ----------------------------------------------------------------
  const loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(
      new OTLPLogExporter({ url: `${ENDPOINT}/v1/logs` }),
    ),
  );
  logs.setGlobalLoggerProvider(loggerProvider);

  registerInstrumentations({
    tracerProvider,
    meterProvider,
    instrumentations: [
      getWebAutoInstrumentations({
        "@opentelemetry/instrumentation-fetch": {
          propagateTraceHeaderCorsUrls: /.*/,
        },
        "@opentelemetry/instrumentation-xml-http-request": {
          propagateTraceHeaderCorsUrls: /.*/,
        },
      }),
    ],
  });

  // ---- Forward uncaught errors to the logs pipeline ------------------------
  const logger = logs.getLogger(SERVICE_NAME);
  const emitError = (message: string) => {
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: message,
    });
  };
  window.addEventListener("error", (event) => emitError(event.message));
  window.addEventListener("unhandledrejection", (event) =>
    emitError(`Unhandled rejection: ${String(event.reason)}`),
  );

  void context;
  void trace;
}
