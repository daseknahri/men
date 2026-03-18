const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const websitePort = 3302;
const adminPort = 3303;
const startupTimeoutMs = 15000;

async function main() {
  const websiteServer = startServer("website-server.js", websitePort);
  const adminServer = startServer("admin-server.js", adminPort);

  try {
    await Promise.all([
      waitForHealth(`http://127.0.0.1:${websitePort}/health`, "website"),
      waitForHealth(`http://127.0.0.1:${adminPort}/health`, "admin")
    ]);

    await runChecks(websitePort, adminPort);
    console.log("Smoke checks passed.");
  } finally {
    await Promise.allSettled([stopServer(websiteServer), stopServer(adminServer)]);
  }
}

function startServer(entryFile, port) {
  const child = spawn(process.execPath, [entryFile], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      COOKIE_SECURE: "false"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${entryFile}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${entryFile}] ${chunk}`);
  });

  return child;
}

async function waitForHealth(url, serviceName) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        if (payload.status === "ok") {
          return payload;
        }
      }
    } catch (_error) {
      // Keep polling until timeout.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serviceName} health check at ${url}`);
}

async function runChecks(websitePort, adminPort) {
  await assertJson(`http://127.0.0.1:${websitePort}/health`, 200, (payload) => {
    if (payload.service !== "website") {
      throw new Error("Website health payload did not include the expected service name.");
    }
  });

  await assertJson(`http://127.0.0.1:${websitePort}/api/data`, 200, (payload) => {
    if (!payload || !Array.isArray(payload.menu)) {
      throw new Error("Website /api/data did not return a restaurant payload with menu data.");
    }
  });

  await assertStatus(`http://127.0.0.1:${websitePort}/admin.html`, 404);

  await assertJson(`http://127.0.0.1:${adminPort}/health`, 200, (payload) => {
    if (payload.service !== "admin") {
      throw new Error("Admin health payload did not include the expected service name.");
    }
  });

  await assertJson(`http://127.0.0.1:${adminPort}/api/admin/session`, 200, (payload) => {
    if (payload.authenticated !== false) {
      throw new Error("Admin session endpoint should report unauthenticated by default.");
    }
  });

  await assertJson(`http://127.0.0.1:${adminPort}/api/data`, 401, (payload) => {
    if (payload.error !== "unauthorized") {
      throw new Error("Admin /api/data should reject unauthenticated requests.");
    }
  });
}

async function assertStatus(url, expectedStatus) {
  const response = await fetch(url);
  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus} from ${url}, got ${response.status}.`);
  }
}

async function assertJson(url, expectedStatus, validate) {
  const response = await fetch(url);
  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus} from ${url}, got ${response.status}.`);
  }

  const payload = await response.json();
  validate(payload);
}

async function stopServer(child) {
  if (!child || child.killed) return;

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }, 3000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    child.kill("SIGTERM");
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
