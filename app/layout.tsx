import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Painel Operacional · Lote 15 e 19 — MetricLab',
  description: 'Painel de controle operacional em tempo real para o Consórcio Lote 15 e 19',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-canvas text-ink font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
