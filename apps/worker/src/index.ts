import { pathToFileURL } from "node:url";

export async function startWorker() {
  console.log("Infamous Freight worker started");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startWorker();
}
