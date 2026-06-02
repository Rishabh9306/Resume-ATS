import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'ResumeATS',
  description: 'Get your resume past ATS filters. AI-powered analysis, keyword optimization, and instant scoring. Trusted by 10,000+ job seekers across India.',
  keywords: 'ATS checker, resume scanner, resume optimization, ATS score, job application, resume keywords, India',
  openGraph: {
    title: 'ResumeATS',
    description: 'AI-powered resume analysis. Get instant ATS compatibility scores and actionable suggestions.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
