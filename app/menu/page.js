import FeaturedMenu from "@/components/home/FeaturedMenu";

const SITE_URL = "https://st-etoile.vercel.app";
const SITE_NAME = "ST Restaurant";
const MENU_URL = `${SITE_URL}/menu`;
const MENU_IMAGE = `${SITE_URL}/opengraph-image`;

const MENU_TITLE = "Restaurant Menu";
const MENU_DESCRIPTION =
  "Explore the ST Restaurant menu featuring signature dishes, freshly prepared meals, delicious desserts, and premium dining options.";

export const metadata = {
  title: MENU_TITLE,
  description: MENU_DESCRIPTION,

  alternates: {
    canonical: "/menu",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: MENU_URL,
    siteName: SITE_NAME,
    title: "Restaurant Menu | ST Restaurant",
    description: MENU_DESCRIPTION,
    images: [
      {
        url: MENU_IMAGE,
        width: 1200,
        height: 630,
        alt: "ST Restaurant — Signature Restaurant Menu",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Restaurant Menu | ST Restaurant",
    description: MENU_DESCRIPTION,
    images: [
      {
        url: MENU_IMAGE,
        alt: "ST Restaurant — Signature Restaurant Menu",
      },
    ],
  },
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#080808]">
      <div className="pt-24">
        <FeaturedMenu />
      </div>
    </main>
  );
}
