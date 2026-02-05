const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const backendDir = path.join(__dirname, "..", "backend");

// Chemin vers Python dans le venv selon l'OS
const pythonPath = isWindows
  ? path.join(backendDir, "venv", "Scripts", "python.exe")
  : path.join(backendDir, "venv", "bin", "python");

console.log(`Starting API server (${isWindows ? "Windows" : "Unix"})...`);

const proc = spawn(pythonPath, ["-m", "uvicorn", "app.main:app", "--reload"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: isWindows,
});

proc.on("error", (err) => {
  console.error("Failed to start API:", err.message);
  console.error("Make sure you ran: npm run install:api");
  process.exit(1);
});

proc.on("close", (code) => {
  process.exit(code);
});
