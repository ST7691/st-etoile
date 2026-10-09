
import ChefStory from "@/components/home/ChefStory";
import DiningExperience from "@/components/home/DiningExperience";
import Hero from "@/components/Hero";
import SignatureDishes from "@/components/home/SignatureDishes";
import FeaturedMenu from "@/components/home/FeaturedMenu";
import Testimonials from "@/components/home/Testimonials";
import ReservationCTA from "@/components/home/ReservationCTA";

const SITE_URL = "https://st-etoile.vercel.app";

const HOME_TITLE = "ST Restaurant | Fine Dining & Fresh Cuisine";

const HOME_DESCRIPTION =
  "Discover ST Restaurant for signature dishes, fresh cuisine, elegant dining, chef-inspired meals, table reservations, and convenient food delivery.";

const HOME_IMAGE = `${SITE_URL}/opengraph-image`;

export const metadata = {
  title: {
    absolute: HOME_TITLE,
  },

  description: HOME_DESCRIPTION,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "ST Restaurant",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: HOME_IMAGE,
        width: 1200,
        height: 630,
        alt: "ST Restaurant — Signature Dishes and Fine Dining",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [
      {
        url: HOME_IMAGE,
        alt: "ST Restaurant — Signature Dishes and Fine Dining",
      },
    ],
  },
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `${SITE_URL}/#restaurant`,
  name: "ST Restaurant",
  url: SITE_URL,
  description: HOME_DESCRIPTION,
  image: HOME_IMAGE,
  servesCuisine: ["International Cuisine", "Fine Dining"],
  acceptsReservations: `${SITE_URL}/reservation`,
  menu: `${SITE_URL}/menu`,
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantSchema).replace(/</g, "\\u003c"),
        }}
      />

      <Hero />
      <SignatureDishes />
      <ChefStory />
      <DiningExperience />
      <FeaturedMenu />
      <Testimonials />
      <ReservationCTA />
    </main>
  );
}

