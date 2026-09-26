"use client";

import { Icon } from "@aiws/icons";
import { ShimmeringText } from "@aiws/ui/components/shimmering-text";
import { useHeroMotionPaused } from "@/components/design/home-hero-section";
import { GradientBorderPill } from "@/components/hero/gradient-border-pill";
import { ParticleBadge } from "@/components/particle-badge";

interface HeroStudioPillProps {
  className?: string;
}

export function HeroStudioPill({ className }: HeroStudioPillProps = {}) {
  const paused = useHeroMotionPaused();

  return (
    <ParticleBadge className={className} paused={paused}>
      <GradientBorderPill
        aria-label="Ai Workstation Console Version 2.1"
        href="/workstation"
        paused={paused}
      >
        <span className="flex h-6 items-center rounded-full bg-muted px-2.5 text-xs leading-none">
          Console
        </span>
        <span className="flex h-6 items-center gap-1 px-2.5 text-xs leading-none">
          <ShimmeringText
            className="leading-none"
            paused={paused}
            text="Version 2.1"
          />
          <Icon className="size-3.5" name="IconArrowRight" />
        </span>
      </GradientBorderPill>
    </ParticleBadge>
  );
}
