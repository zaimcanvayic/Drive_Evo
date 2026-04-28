import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserButton } from "@/components/UserButton";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DriveMetrics",
  description: "Sürüş analiz platformu",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          <div className="fixed top-4 right-4 z-50">
            {session ? (
              <UserButton user={session.user} />
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-red-400"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Kaydol
                </Link>
              </div>
            )}
          </div>
        {children}
        </Providers>
      </body>
    </html>
  );
}
