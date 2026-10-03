import FeaturedMenu from "@/components/home/FeaturedMenu";

export const metadata = {
  title: "Menu | ST Restaurant",
  description: "Explore the signature menu at ST Restaurant.",
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
