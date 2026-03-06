export function startAIApp() {
  console.log("Infamous Freight AI app started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startAIApp();
}
