const required = ["NEXT_PUBLIC_API_URL"];

const missing = required.filter((key) => {
  const value = process.env[key];

  if (!value) {
    return true;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes("replace_me") || lower.includes("example.com")) {
    return true;
  }

  return false;
});

if (missing.length) {
  console.error("Missing or invalid required env vars:", missing.join(", "));
  process.exit(1);
}

console.log("Env OK");
