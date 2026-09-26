import { HomePartnersGrid } from "@/components/design/home-partners-grid";
import { HomePastPartners } from "@/components/design/home-past-partners";
import { DesignSectionHeader } from "@/components/design/section-header";

export function HomePartnersSection() {
  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          className="pb-6"
          subtitle="Backed by open infrastructure and platform partners"
          title="Ecosystem partners"
          titleId="ecosystem-heading"
        />
        <HomePartnersGrid />
        <HomePastPartners />
      </div>
    </section>
  );
}
