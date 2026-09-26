"use client";

import { DEFAULT_CHART_ENTER_TRANSITION } from "@aiws/ui/charts";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  type Partner,
  type PartnerSlot,
  type PartnerTier,
  partnerLink,
  partnerTierLabels,
  premiumLogoClassName,
  premiumPartnerSlots,
  silverLogoClassName,
  silverPartnerSlots,
} from "@/lib/partners";
import { cn } from "@/lib/utils";
import { GridCornerDots } from "./line-grid";
import { DesignPartnerPanel } from "./partner-panel";

const chartEase = DEFAULT_CHART_ENTER_TRANSITION.ease as [
  number,
  number,
  number,
  number,
];
const partnerLogoEnterDuration = 0.45;
const partnerLogoExitDuration = 0.32;
const partnerLabelEnterDuration = 0.45;
const partnerLabelExitDuration = 0.32;
const partnerLabelEnterDelay = 0.1;
const partnerBlurClearDuration = 0.28;

function getPartnerLabelTransition(
  active: boolean,
  reducedMotion: boolean | null
) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  if (active) {
    return {
      y: {
        duration: partnerLabelEnterDuration,
        ease: chartEase,
        delay: partnerLabelEnterDelay,
      },
      opacity: {
        duration: partnerLabelEnterDuration,
        ease: chartEase,
        delay: partnerLabelEnterDelay,
      },
      filter: {
        duration: partnerBlurClearDuration,
        ease: chartEase,
      },
    };
  }

  return {
    duration: partnerLabelExitDuration,
    ease: chartEase,
  };
}

function PartnerPlaceholder({
  minHeight,
  patternReversed,
}: {
  minHeight: number;
  patternReversed: boolean;
}) {
  return (
    <DesignPartnerPanel
      href={partnerLink}
      minHeight={minHeight}
      patternReversed={patternReversed}
      variant="placeholder"
    >
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="inline-flex rotate-45 scale-100 font-light font-mono text-muted-foreground text-xs transition-[rotate,scale,color] duration-[180ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:rotate-0 group-hover:scale-110 group-hover:text-foreground motion-reduce:rotate-0 motion-reduce:transition-none">
          +
        </span>
      </span>
    </DesignPartnerPanel>
  );
}

function PartnerLogoHoverContent({
  Logo,
  active,
  logoClassName,
  tierLabel,
}: {
  Logo: Partner["Logo"];
  active: boolean;
  logoClassName: string;
  tierLabel: string;
}) {
  const reducedMotion = useReducedMotion();
  const showLabel = active;

  const logoTransition = reducedMotion
    ? { duration: 0 }
    : {
        duration: active ? partnerLogoEnterDuration : partnerLogoExitDuration,
        ease: chartEase,
      };

  const labelTransition = getPartnerLabelTransition(active, reducedMotion);

  return (
    <div className="flex flex-col items-center">
      <motion.span
        animate={{ y: active ? -14 : 0 }}
        initial={false}
        transition={logoTransition}
      >
        <Logo className={logoClassName} />
      </motion.span>
      <motion.span
        animate={{
          y: showLabel ? 0 : -13,
          opacity: showLabel ? 1 : 0,
          filter: showLabel ? "blur(0px)" : "blur(2px)",
        }}
        aria-hidden={!showLabel}
        className="whitespace-nowrap font-light text-muted-foreground text-xs"
        initial={false}
        transition={labelTransition}
      >
        {tierLabel}
      </motion.span>
    </div>
  );
}

function PartnerLogoPanel({
  partner,
  logoClassName,
  minHeight,
  tier,
}: {
  partner: Partner;
  logoClassName: string;
  minHeight: number;
  tier: PartnerTier;
}) {
  const [active, setActive] = useState(false);
  const { href, name } = partner;
  const tierLabel = partnerTierLabels[tier];

  return (
    <DesignPartnerPanel
      ariaLabel={`${name}, ${tierLabel}`}
      href={href}
      minHeight={minHeight}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setActive(false);
        }
      }}
      onFocus={() => setActive(true)}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      variant="default"
    >
      <PartnerLogoHoverContent
        active={active}
        Logo={partner.Logo}
        logoClassName={logoClassName}
        tierLabel={tierLabel}
      />
    </DesignPartnerPanel>
  );
}

function getMobilePartnerSlots(
  slots: PartnerSlot[],
  variant: "premium" | "silver"
): PartnerSlot[] {
  const partners = slots.filter(
    (slot): slot is Partner => slot !== "placeholder"
  );

  if (variant === "silver" && partners.length % 2 === 1) {
    return [...partners, "placeholder"];
  }

  return partners;
}

function PartnerSlotItems({
  slots,
  minHeight,
  variant,
  logoClassName,
  placeholderOffset = 0,
  keyPrefix,
}: {
  slots: PartnerSlot[];
  minHeight: number;
  variant: "premium" | "silver";
  logoClassName: string;
  placeholderOffset?: number;
  keyPrefix: string;
}) {
  let placeholderIndex = placeholderOffset;

  return slots.map((slot, index) =>
    slot === "placeholder" ? (
      <PartnerPlaceholder
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholder slots
        key={`${keyPrefix}-placeholder-${index}`}
        minHeight={minHeight}
        patternReversed={placeholderIndex++ % 2 === 1}
      />
    ) : (
      <PartnerLogoPanel
        key={`${keyPrefix}-${slot.id}`}
        logoClassName={logoClassName}
        minHeight={minHeight}
        partner={slot}
        tier={variant}
      />
    )
  );
}

function PartnerRow({
  slots,
  minHeight,
  variant,
  logoClassName,
  placeholderOffset = 0,
}: {
  slots: PartnerSlot[];
  minHeight: number;
  variant: "premium" | "silver";
  logoClassName: string;
  placeholderOffset?: number;
}) {
  const mobileSlots = getMobilePartnerSlots(slots, variant);
  const mobileColumns = variant === "premium" ? 1 : 2;
  const mobileRows = Math.ceil(mobileSlots.length / mobileColumns);
  const desktopColumns = slots.length;
  const gridClassName =
    variant === "premium"
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-5";

  return (
    <div className="relative w-full overflow-visible">
      <div
        className={cn("grid w-full overflow-visible md:hidden", gridClassName)}
      >
        <PartnerSlotItems
          keyPrefix={`${variant}-mobile`}
          logoClassName={logoClassName}
          minHeight={minHeight}
          placeholderOffset={placeholderOffset}
          slots={mobileSlots}
          variant={variant}
        />
      </div>
      <div
        className={cn("hidden w-full overflow-visible md:grid", gridClassName)}
      >
        <PartnerSlotItems
          keyPrefix={`${variant}-desktop`}
          logoClassName={logoClassName}
          minHeight={minHeight}
          placeholderOffset={placeholderOffset}
          slots={slots}
          variant={variant}
        />
      </div>
      <GridCornerDots
        className="z-3 md:hidden"
        columns={mobileColumns}
        rows={mobileRows}
      />
      <GridCornerDots
        className="z-3 hidden md:block"
        columns={desktopColumns}
        rows={1}
      />
    </div>
  );
}

export function HomePartnersGrid() {
  const premiumPlaceholderCount = premiumPartnerSlots.filter(
    (slot) => slot === "placeholder"
  ).length;

  return (
    <div className="relative flex w-full flex-col overflow-visible border-border border-t border-l">
      <PartnerRow
        logoClassName={premiumLogoClassName}
        minHeight={160}
        slots={premiumPartnerSlots}
        variant="premium"
      />
      <PartnerRow
        logoClassName={silverLogoClassName}
        minHeight={140}
        placeholderOffset={premiumPlaceholderCount}
        slots={silverPartnerSlots}
        variant="silver"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        data-grid-rulers
      >
        <div className="absolute -top-8 left-0 block h-10 w-px bg-muted-foreground/40" />
        <div className="absolute top-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
        <div className="absolute -top-8 right-0 block h-10 w-px bg-muted-foreground/40" />
        <div className="absolute top-0 -right-8 block h-px w-10 bg-muted-foreground/40" />

        <div className="absolute -bottom-8 left-0 block h-10 w-px bg-muted-foreground/40" />
        <div className="absolute bottom-0 -left-8 block h-px w-10 bg-muted-foreground/40" />
        <div className="absolute right-0 -bottom-8 block h-10 w-px bg-muted-foreground/40" />
        <div className="absolute -right-8 bottom-0 block h-px w-10 bg-muted-foreground/40" />

        <div className="absolute -top-8 -right-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
        <div className="absolute -bottom-8 -left-8 block h-6 w-6 bg-[repeating-linear-gradient(45deg,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_0,color-mix(in_oklch,var(--muted-foreground)_40%,transparent)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px] bg-fixed opacity-80" />
      </div>
    </div>
  );
}
