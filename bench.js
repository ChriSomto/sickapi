// bench.js
// Usage:
//   node bench.js all local          → hits http://localhost:3000
//   node bench.js all prod           → hits your Vercel URL (set VERCEL_URL env)
//   node bench.js light              → only /api/ping, local
//   node bench.js medium             → only /api/crunch, local
//   node bench.js heavy              → only /api/heavy, local

import autocannon from "autocannon";

// ── Config ────────────────────────────────────────────────────────────────
const BASE_LOCAL = "http://localhost:3000";
const BASE_PROD = process.env.VERCEL_URL || "https://YOUR-PROJECT.vercel.app";

const ENDPOINTS = {
  light: "/api/ping",
  medium: "/api/crunch",
  heavy: "/api/heavy",
};

// Request volumes to test per endpoint
// ⚠️  50k and 100k are commented out to save your mobile data — uncomment
//     only when on WiFi / wired connection.
const VOLUMES = [
  { requests: 1_000, label: "1k" },
  { requests: 10_000, label: "10k" },
  // { requests: 50_000, label: "50k" },   // ~uncomment on WiFi
  // { requests: 100_000, label: "100k" },  // ~uncomment on WiFi
];

const CONNECTIONS = 10; // concurrent connections per run
const PIPELINING = 1; // keep at 1 for fair serverless comparison

// ── Helpers ───────────────────────────────────────────────────────────────
function run(url, amount) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections: CONNECTIONS,
        pipelining: PIPELINING,
        amount, // total requests (not duration)
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: true });
  });
}

function printResult(label, volume, result) {
  const r = result.requests;
  const lat = result.latency;
  const thr = result.throughput;

  console.log(`
┌─────────────────────────────────────────────┐
│  Endpoint : ${label.padEnd(30)} │
│  Volume   : ${volume.padEnd(30)} │
├─────────────────────────────────────────────┤
│  Req/sec  avg  : ${String(r.average).padEnd(26)} │
│  Req/sec  max  : ${String(r.max).padEnd(26)} │
│  Latency  avg  : ${(lat.average + " ms").padEnd(26)} │
│  Latency  p99  : ${(lat.p99 + " ms").padEnd(26)} │
│  Latency  max  : ${(lat.max + " ms").padEnd(26)} │
│  Errors        : ${String(result.errors).padEnd(26)} │
│  Timeouts      : ${String(result.timeouts).padEnd(26)} │
│  Throughput avg: ${(Math.round(thr.average / 1024) + " KB/s").padEnd(26)} │
└─────────────────────────────────────────────┘`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "all"; // light | medium | heavy | all
  const target = args[1] === "prod" ? BASE_PROD : BASE_LOCAL;

  const endpointsToTest =
    mode === "all"
      ? Object.entries(ENDPOINTS)
      : [[mode, ENDPOINTS[mode]]];

  if (!endpointsToTest[0][1]) {
    console.error(
      `Unknown mode "${mode}". Use: light | medium | heavy | all`
    );
    process.exit(1);
  }

  console.log(`\n🚀  Benchmarking against: ${target}`);
  console.log(`   Connections : ${CONNECTIONS}`);
  console.log(`   Volumes     : ${VOLUMES.map((v) => v.label).join(", ")}\n`);

  for (const [name, path] of endpointsToTest) {
    for (const { requests, label } of VOLUMES) {
      const url = `${target}${path}`;
      console.log(`\n⏳  Running ${name.toUpperCase()} — ${label} requests → ${url}`);
      try {
        const result = await run(url, requests);
        printResult(name, label, result);
      } catch (err) {
        console.error(`❌  Failed: ${err.message}`);
      }
    }
  }

  console.log("\n✅  All benchmarks complete.\n");
}

main();