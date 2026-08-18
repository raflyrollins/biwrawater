import { usePage } from '@inertiajs/react';
import CtaSection from '../components/public/CtaSection';
import Faq from '../components/public/Faq';
import Features from '../components/public/Features';
import Footer from '../components/public/Footer';
import Hero from '../components/public/Hero';
import HowItWorks from '../components/public/HowItWorks';
import Navbar from '../components/public/Navbar';
import ServiceArea from '../components/public/ServiceArea';
import Services from '../components/public/Services';
import { ThemeProvider } from '../hooks/useTheme';

export default function Home() {
    const { appearance } = usePage().props;

    return (
        <ThemeProvider appearance={appearance}>
            <Navbar />
            <main>
                <Hero />
                <Services />
                <HowItWorks />
                <ServiceArea />
                <Features />
                <Faq />
                <CtaSection />
            </main>
            <Footer />
        </ThemeProvider>
    );
}
