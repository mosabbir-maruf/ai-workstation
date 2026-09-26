import type { Metadata } from "next";
import { DesignHeroCanvas } from "@/components/design/design-hero-canvas";
import { HomeFaqSection } from "@/components/design/home-faq-section";
import { HomeFeaturesSection } from "@/components/design/home-features-section";
import { HomeFooter } from "@/components/design/home-footer";
import { HomeHeroSection } from "@/components/design/home-hero-section";
import { HomeHowItWorksSection } from "@/components/design/home-how-it-works-section";
import { HomePartnersSection } from "@/components/design/home-partners-section";
import { HomeTelemetrySection } from "@/components/design/home-telemetry-section";
import { HomeWorkflowsSection } from "@/components/design/home-workflows-section";
import { LineGrid } from "@/components/design/line-grid";
import { UsedBySection } from "@/components/design/used-by-section";
import { JsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ_ITEMS } from "@/lib/faq-data";
import { createMetadata, getFaqSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/",
});

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <JsonLd schema={getFaqSchema(HOME_FAQ_ITEMS)} />
      <div className="flex w-full flex-col gap-0">
        <HomeHeroSection>
          <div className="container mx-auto w-full overflow-visible pt-8 md:pt-16">
            <LineGrid
              className="aspect-3/2 [--grid-cell-height:calc(100%/2)] [--grid-cell-width:calc(100%/3)] md:aspect-4/2 lg:aspect-6/3 md:[--grid-cell-height:calc(100%/2)] md:[--grid-cell-width:calc(100%/4)] lg:[--grid-cell-height:calc(100%/3)] lg:[--grid-cell-width:calc(100%/6)]"
              columns={3}
              columnsLg={6}
              columnsMd={4}
              pulse
              pulseMaxActive={2}
              pulseMaxActiveLg={6}
              pulseMaxActiveMd={4}
              pulseMinActive={1}
              pulseMinActiveLg={3}
              pulseMinActiveMd={2}
              rows={2}
              rowsLg={3}
              rowsMd={2}
              variant="solid"
            >
              <DesignHeroCanvas />
            </LineGrid>
          </div>
        </HomeHeroSection>
        <UsedBySection />
        <HomeFeaturesSection />
        <HomeTelemetrySection />
        <HomeHowItWorksSection />
        <HomeWorkflowsSection />
        <HomeFaqSection />
        <HomePartnersSection />
        <HomeFooter />
      </div>
    </main>
  );
}
