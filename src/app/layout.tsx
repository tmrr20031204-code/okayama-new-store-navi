import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新規店オープンナビ - 岡山エリア',
  description: '食肉卸売の配送・営業向け新規店舗管理アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
