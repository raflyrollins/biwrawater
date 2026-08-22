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

interface HomeProps {
    services: Array<{
        id: number;
        name: string;
        description: string | null;
        price: number;
        volume_liters: number;
    }>;
    schedule_status: {
        is_open: boolean;
        message: string;
    };
}

export default function Home({ services, schedule_status }: HomeProps) {
    const { appearance } = usePage().props;

    return (
        <ThemeProvider appearance={appearance}>
            <Navbar />
            <main>
                <Hero
                    is_open={schedule_status.is_open}
                    closed_message={schedule_status.message}
                />
                <Services services={services} />
                <HowItWorks />
                <ServiceArea schedule_status={schedule_status} />
                <Features />
                <Faq />
                <CtaSection />
            </main>
            <Footer />
        </ThemeProvider>
    );
}
