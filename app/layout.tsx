import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RetinaReview — See clearly. Review thoughtfully.', description: 'A human-led retinal image review research prototype.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>;}

