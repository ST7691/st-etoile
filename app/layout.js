import "./globals.css";

import PageLoader from "@/components/PageLoader";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const SITE_URL = "https://st-etoile.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ST Restaurant | Fine Dining & Fresh Cuisine",
    template: "%s | ST Restaurant",
  },

  description:
    "Discover ST Restaurant for delicious cuisine, a premium dining experience, table reservations, and convenient food delivery.",

  applicationName: "ST Restaurant",

  keywords: [
    "ST Restaurant",
    "restaurant",
    "fine dining",
    "food delivery",
    "online food ordering",
    "restaurant reservations",
    "fresh cuisine",
  ],

  authors: [{ name: "ST Restaurant" }],
  creator: "ST Restaurant",
  publisher: "ST Restaurant",

  alternates: {
    canonical: "/",
  },

  verification: {
    google: "IJzMcNML4owJ7yYvLO1T0BfI2-B0oW1CuehxhnH8754",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ST Restaurant",
    title: "ST Restaurant | Fine Dining & Fresh Cuisine",
    description:
      "Enjoy delicious cuisine, explore our menu, reserve a table, and order food online with ST Restaurant.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ST Restaurant",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ST Restaurant | Fine Dining & Fresh Cuisine",
    description:
      "Explore our menu, reserve a table, and enjoy convenient food delivery with ST Restaurant.",
    images: ["/opengraph-image"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "food",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <PageLoader /> <ConditionalLayout>{children}</ConditionalLayout>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
