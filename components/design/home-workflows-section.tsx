import { HomeWorkflowsGrid } from "@/components/design/home-workflows-grid";
import { DesignSectionHeader } from "@/components/design/section-header";

export function HomeWorkflowsSection() {
  return (
    <section
      aria-labelledby="workflows-heading"
      className="relative w-full pt-12 md:pt-24"
    >
      <div className="container mx-auto w-full overflow-visible">
        <DesignSectionHeader
          subtitle="Everything you need to orchestrate projects, runtimes, and tunnels from one CLI"
          title="Developer workflows"
          titleId="workflows-heading"
        />
        <HomeWorkflowsGrid />
      </div>
    </section>
  );
}
