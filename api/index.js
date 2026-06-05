import Fastify from "fastify";
// Note: @vercel/analytics package is installed but not actively integrated
// as this is a backend API. Vercel Web Analytics requires a browser environment.
// For API monitoring, use Vercel's observability tools (Logs, Monitoring) instead.

const app = Fastify();

app.get("/hi", async (request, reply) => {
  return { message: "heyy" };
});

app.get("/math1", async (request, reply) => {
  const SIZE = 10_000;

  const data = Array.from({ length: SIZE }, () => Math.random() * 1_000_000);
  data.sort((a, b) => a - b);

  const sum = data.reduce((acc, v) => acc + v, 0);
  const mean = sum / SIZE;
  const variance =
    data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / SIZE;

  return {
    message: {
      arraySize: SIZE,
      min: +data[0].toFixed(4),
      max: +data[SIZE - 1].toFixed(4),
      mean: +mean.toFixed(4),
      median: +data[Math.floor(SIZE / 2)].toFixed(4),
      stddev: +Math.sqrt(variance).toFixed(4),
    },
   };
});

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function matMul(A, B, n) {
  const C = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++)
      for (let j = 0; j < n; j++) C[i][j] += A[i][k] * B[k][j];
  return C;
}

app.get("/math2", async (request, reply) => {
  const SIZE = 100_000;
  const MATRIX_N = 100;
  const HASH_ROUNDS = 5_000;

  const data = Array.from({ length: SIZE }, () => Math.random() * 1_000_000);
  data.sort((a, b) => a - b);

  const sum = data.reduce((acc, v) => acc + v, 0);
  const mean = sum / SIZE;
  const variance =
    data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / SIZE;

  const A = Array.from({ length: MATRIX_N }, () =>
    Array.from({ length: MATRIX_N }, () => Math.random())
  );
  const B = Array.from({ length: MATRIX_N }, () =>
    Array.from({ length: MATRIX_N }, () => Math.random())
  );
  const C = matMul(A, B, MATRIX_N);

  let h = "benchmark-seed";
  for (let i = 0; i < HASH_ROUNDS; i++) h = fnv1a(h + i);

  return {
    message: {
      arraySize: SIZE,
      matrixSize: `${MATRIX_N}x${MATRIX_N}`,
      hashRounds: HASH_ROUNDS,
      min: +data[0].toFixed(4),
      max: +data[SIZE - 1].toFixed(4),
      mean: +mean.toFixed(4),
      median: +data[Math.floor(SIZE / 2)].toFixed(4),
      stddev: +Math.sqrt(variance).toFixed(4),
      matrixSample: +C[0][0].toFixed(6),
      finalHash: h,
    },
  };
});

export default async function handler(req, res) {
  await app.ready();
  app.server.emit("request", req, res);
}

if (!process.env.VERCEL) {
  app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Akthieffffff at ${address}`);
  });
}