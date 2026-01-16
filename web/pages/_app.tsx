import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GlobalLayout from "../components/GlobalLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GlobalLayout>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </GlobalLayout>
  );
}
