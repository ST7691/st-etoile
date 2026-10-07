import Link from "next/link";
import {
  Award,
  ChefHat,
  Clock3,
  Heart,
  Leaf,
  Sparkles,
  Utensils,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "Discover the story, philosophy and passion behind ST Restaurant.",
};

const values = [
  {
    icon: ChefHat,
    title: "Passionate Cuisine",
    description:
      "Every dish is carefully prepared with attention to flavor, presentation and quality.",
  },
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    description:
      "We believe great food begins with carefully selected, fresh and quality ingredients.",
  },
  {
    icon: Heart,
    title: "Made With Care",
    description:
      "From our kitchen to your table, every detail is handled with genuine care.",
  },
  {
    icon: Users,
    title: "Guest First",
    description:
      "Our guests are at the heart of everything we do, from service to dining experience.",
  },
];

const stats = [
  {
    value: "10+",
    label: "Signature Dishes",
  },
  {
    value: "5K+",
    label: "Happy Guests",
  },
  {
    value: "4.9",
    label: "Average Rating",
  },
  {
    value: "7 Days",
    label: "Open Every Week",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.06),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-36 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#d4af37]">
              <Sparkles size={14} />
              Our Story
            </div>

            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Where Great Food Meets
              <span className="block text-[#d4af37]">Exceptional Moments</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              ST Restaurant is built around a simple idea — beautiful food,
              thoughtful hospitality and memorable moments should come together
              at one table.
            </p>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
              The ST Experience
            </p>

            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              More Than Just a Restaurant
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-white/60 sm:text-base">
              <p>
                ST Restaurant was created for people who appreciate good food,
                elegant surroundings and genuine hospitality.
              </p>

              <p>
                Our kitchen combines carefully selected ingredients with
                thoughtful preparation to create dishes that feel familiar,
                exciting and memorable at the same time.
              </p>

              <p>
                Whether you are joining us for a casual meal, a family
                gathering, a special celebration or simply a quiet evening, our
                goal is to make every visit worth remembering.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#080808] transition hover:bg-[#f1d77a]"
              >
                Explore Our Menu
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#d4af37]/5 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-[#d4af37]/20 bg-gradient-to-br from-[#171717] via-[#101010] to-[#0b0b0b] p-8 shadow-2xl sm:p-10">
              <div className="flex h-72 items-center justify-center rounded-2xl border border-white/5 bg-[#0d0d0d]">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10">
                    <Utensils size={32} className="text-[#d4af37]" />
                  </div>

                  <p className="mt-5 font-serif text-3xl font-bold">
                    ST Restaurant
                  </p>

                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#d4af37]">
                    Taste • Quality • Experience
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <Award size={20} className="text-[#d4af37]" />
                  <p className="mt-3 text-sm font-semibold">Premium Quality</p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <Clock3 size={20} className="text-[#d4af37]" />
                  <p className="mt-3 text-sm font-semibold">Fresh Every Day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
              What We Believe
            </p>

            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Our Values
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/50">
              The principles that guide our kitchen, our team and every guest
              experience.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/25"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5">
                    <Icon size={22} className="text-[#d4af37]" />
                  </div>

                  <h3 className="mt-5 font-serif text-xl font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/50">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#d4af37]/10 bg-[#0d0d0d] p-6 text-center"
            >
              <p className="font-serif text-3xl font-bold text-[#d4af37] sm:text-4xl">
                {stat.value}
              </p>

              <p className="mt-2 text-xs uppercase tracking-wider text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#d4af37]/20 bg-gradient-to-br from-[#17130a] to-[#0d0d0d] px-6 py-14 text-center sm:px-10">
          <Sparkles className="mx-auto text-[#d4af37]" size={25} />

          <h2 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">
            Ready for a Memorable Meal?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50">
            Explore our menu or reserve your table and let ST Restaurant take
            care of the rest.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/reservation"
              className="rounded-full bg-[#d4af37] px-7 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#f1d77a]"
            >
              Reserve Your Table
            </Link>

            <Link
              href="/contact"
              className="rounded-full border border-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
