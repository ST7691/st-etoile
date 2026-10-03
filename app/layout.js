import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollButtons from "@/components/ScrollButtons";
import PageLoader from "@/components/PageLoader";

export const metadata = {
  title: "ST Restaurant | Fine Dining",
  description:
    "ST Restaurant — premium dining, delicious cuisine, reservations and home delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageLoader />
        <Navbar />

        {children}

        <Footer />

        <ScrollButtons />
      </body>
    </html>
  );
}
