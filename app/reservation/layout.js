const SITE_URL = "https://st-etoile.vercel.app";
const SITE_NAME = "ST Restaurant";
const RESERVATION_URL = `${SITE_URL}/reservation`;
const RESERVATION_IMAGE = `${SITE_URL}/opengraph-image`;

const RESERVATION_TITLE = "Restaurant Reservations | ST Restaurant";

const RESERVATION_DESCRIPTION =
  "Reserve your table at ST Restaurant in Sylhet, Bangladesh. Choose your preferred dining date, time, and number of guests, and submit special requests for your next dining experience.";

export const metadata = {
  title: {
    absolute: RESERVATION_TITLE,
  },

  description: RESERVATION_DESCRIPTION,

  alternates: {
    canonical: "/reservation",
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

  openGraph: {
    type: "website",
    locale: "en_US",
    url: RESERVATION_URL,
    siteName: SITE_NAME,
    title: RESERVATION_TITLE,
    description: RESERVATION_DESCRIPTION,
    images: [
      {
        url: RESERVATION_IMAGE,
        width: 1200,
        height: 630,
        alt: "Reserve a table at ST Restaurant",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: RESERVATION_TITLE,
    description: RESERVATION_DESCRIPTION,
    images: [
      {
        url: RESERVATION_IMAGE,
        alt: "ST Restaurant table reservations",
      },
    ],
  },
};

export default function ReservationLayout({ children }) {
  return children;
}
