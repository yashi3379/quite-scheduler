import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quite Scheduler",
  description: "SNS Content Scheduling Platform",
};

// This is a minimal root layout for the redirect page
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}