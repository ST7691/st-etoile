import "./globals.css";

import PageLoader from "@/components/PageLoader";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

export const metadata = {
  title: "ST Restaurant | Fine Dining",
  description:
    "ST Restaurant — premium dining, delicious cuisine, reservations and home delivery.",
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
