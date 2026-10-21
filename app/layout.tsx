import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Student Marketplace',
  description: 'Buy and sell second-hand textbooks, electronics, furniture, and more on campus.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="container py-6">{children}</main>
          <footer className="border-t border-gray-200 py-6">
            <div className="container text-sm text-gray-500">
              Student Marketplace — buy and sell second-hand goods on campus.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
