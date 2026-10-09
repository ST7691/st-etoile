import Link from "next/link";
import {
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Utensils,
} from "lucide-react";

const SITE_URL = "https://st-etoile.vercel.app";
const SITE_NAME = "ST Restaurant";
const CONTACT_URL = `${SITE_URL}/contact`;
const CONTACT_IMAGE = `${SITE_URL}/opengraph-image`;

const CONTACT_TITLE = "Contact ST Restaurant | Reservations & Inquiries";
const CONTACT_DESCRIPTION =
  "Contact ST Restaurant for table reservations, menu inquiries, dining information, delivery questions, and special events. We look forward to hearing from you.";

export const metadata = {
  title: {
    absolute: CONTACT_TITLE,
  },

  description: CONTACT_DESCRIPTION,

  alternates: {
    canonical: "/contact",
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
    url: CONTACT_URL,
    siteName: SITE_NAME,
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    images: [
      {
        url: CONTACT_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contact ST Restaurant — Reservations and Inquiries",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    images: [
      {
        url: CONTACT_IMAGE,
        alt: "Contact ST Restaurant — Reservations and Inquiries",
      },
    ],
  },
};

const contactInfo = [
  {
    icon: Phone,
    title: "Call Us",
    value: "+880 1XXX-XXXXXX",
    description: "Available during restaurant hours",
  },
  {
    icon: Mail,
    title: "Email",
    value: "[hello@strestaurant.com](mailto:hello@strestaurant.com)",
    description: "We usually reply within one business day",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Dhaka, Bangladesh",
    description: "Contact us for the exact location",
  },
  {
    icon: Clock3,
    title: "Opening Hours",
    value: "11:00 AM – 11:00 PM",
    description: "Open 7 days a week",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HERO */}{" "}
      <section className="relative overflow-hidden border-b border-white/5">
        {" "}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.07),transparent_35%)]" />
        ```
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-36 sm:px-6 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#d4af37]">
              <Mail size={14} />
              Contact Us
            </div>

            <h1 className="font-serif text-4xl font-bold sm:text-5xl lg:text-6xl">
              Let&apos;s Start a
              <span className="block text-[#d4af37]">Conversation</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              Have a question about our menu, reservations, dining experience or
              delivery? We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>
      {/* CONTACT INFO */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/25"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5">
                  <Icon size={21} className="text-[#d4af37]" />
                </div>

                <h2 className="mt-5 font-serif text-xl font-semibold">
                  {item.title}
                </h2>

                <p className="mt-3 break-words text-sm font-medium text-[#d4af37]">
                  {item.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      {/* CONTACT AREA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/5 bg-[#0d0d0d] lg:grid-cols-2">
          {/* LEFT */}
          <div className="relative p-8 sm:p-10 lg:p-14">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                Get In Touch
              </p>

              <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
                We&apos;re Here to Help
              </h2>

              <p className="mt-5 text-sm leading-7 text-white/50">
                Whether you want to ask about a dish, make a reservation,
                discuss an event or learn more about our services, our team is
                ready to help.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10">
                    <Utensils size={18} className="text-[#d4af37]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Restaurant</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Premium dining and carefully prepared cuisine.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10">
                    <Sparkles size={18} className="text-[#d4af37]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Special Events</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Ask us about private dining and special occasions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/reservation"
                  className="rounded-full bg-[#d4af37] px-6 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#f1d77a]"
                >
                  Reserve a Table
                </Link>

                <Link
                  href="/menu"
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                >
                  View Menu
                </Link>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="border-t border-white/5 bg-[#101010] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
            <form className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-medium text-white/60"
                  >
                    Your Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium text-white/60"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-xs font-medium text-white/60"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-xs font-medium text-white/60"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="How can we help?"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-xs font-medium text-white/60"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
                />
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3.5 text-sm font-bold text-[#080808] transition hover:bg-[#f1d77a]"
              >
                <Send size={16} />
                Send Message
              </button>

              <p className="text-center text-[11px] leading-5 text-white/30">
                We&apos;ll get back to you as soon as possible.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
