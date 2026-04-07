export default function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#0f172a" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
      <script src="/register-sw.js" defer />
    </>
  );
}
