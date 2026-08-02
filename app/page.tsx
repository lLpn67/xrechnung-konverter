import { Hero } from "@/components/Hero";
import { LegalExplainer } from "@/components/LegalExplainer";
import { InvoiceTool } from "@/components/InvoiceTool";
import { Faq } from "@/components/Faq";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <LegalExplainer />
      <InvoiceTool />
      <Faq />
      <Waitlist />
      <Footer />
    </main>
  );
}
