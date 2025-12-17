import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import CookieConsent from '../components/CookieConsent';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <CookieConsent />
    </LanguageProvider>
  );
}

