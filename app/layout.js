
import "./globals.css";

import PageLoader from "@/components/PageLoader";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const SITE_URL = "https://st-etoile.vercel.app";
const SITE_NAME = "ST Restaurant";
const DEFAULT_TITLE = "ST Restaurant | Fine Dining & Fresh Cuisine";
const DEFAULT_DESCRIPTION =
  "Discover ST Restaurant for delicious cuisine, fresh meals, premium dining, table reservations, and convenient food delivery.";

const OG_IMAGE = `${SITE_URL}/opengraph-image`;
const LOGO_URL = `${SITE_URL}/icon.png`;

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_TITLE,
    template: "%s | ST Restaurant",
  },

  description: DEFAULT_DESCRIPTION,

  applicationName: SITE_NAME,
  category: "food",

  keywords: [
    "ST Restaurant",
    "restaurant",
    "fine dining",
    "fresh cuisine",
    "online food ordering",
    "food delivery",
    "restaurant reservations",
    "restaurant menu",
    "gourmet food",
  ],

  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  alternates: {
    canonical: "/",
  },

  verification: {
    google: "IJzMcNML4owJ7yYvLO1T0BfI2-B0oW1CuehxhnH8754",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ST Restaurant — Fine Dining and Fresh Cuisine",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        alt: "ST Restaurant — Fine Dining and Fresh Cuisine",
      },
    ],
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <PageLoader />
          <ConditionalLayout>{children}</ConditionalLayout>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

