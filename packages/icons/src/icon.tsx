import type { ComponentProps, SVGProps } from "react";

export const iconPaths: Record<string, string> = {
  IconCrossSmall:
    '<path d="M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  IconLoadingCircle:
    '<path d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12Z" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/><path d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  IconArrowRight:
    '<path d="M14 5.75L20.25 12L14 18.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 12H3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconCheckmark2:
    '<path d="M2.75 15.0938L9 20.25L21.25 3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconChevronGrabberVertical:
    '<path d="M8 9L12 5L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 15L12 19L8 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconArrowUp:
    '<path d="M12 20.25V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.75 10L12 3.75L18.25 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconArrowDown:
    '<path d="M18.25 14L12 20.25L5.75 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19.5V3.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconClipboard2:
    '<path d="M16.25 4.75H20.25V21.25H3.75V4.75H7.75M7.75 2.75H16.25V7.25H7.75V2.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>',
  IconCheckmark1:
    '<path d="M4.75 12.7768L10 19.25L19.25 4.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  IconQuickSearch:
    '<path d="M18 17L21.25 20.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3.70746 16.1746L7.91799 11.2623C8.24057 10.8859 8.85524 11.1579 8.79376 11.6497L8.49998 14H10.9129C11.34 14 11.5705 14.501 11.2925 14.8254L7.08196 19.7377C6.75938 20.114 6.14471 19.8421 6.20619 19.3502L6.49998 17H4.08709C3.65991 17 3.42946 16.4989 3.70746 16.1746Z" fill="currentColor"/><path d="M12 19.25C16.5563 19.25 20.25 15.5563 20.25 11C20.25 6.44365 16.5563 2.75 12 2.75C7.44365 2.75 3.75 6.44365 3.75 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  IconChevronDownSmall:
    '<path d="M8 10L12 14L16 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconChevronLeft:
    '<path d="M15 20L7 12L15 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconChevronRight:
    '<path d="M9 4L17 12L9 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconSun:
    '<path d="M11.9982 3.29071V1.76746M5.83985 18.1585L4.76275 19.2356M11.9982 22.2326V20.7093M19.2334 4.76456L18.1562 5.84166M20.707 12H22.2303M18.1562 18.1584L19.2334 19.2355M1.76562 12H3.28888M4.76267 4.7645L5.83977 5.8416M15.7104 8.28769C17.7606 10.3379 17.7606 13.6621 15.7104 15.7123C13.6601 17.7626 10.336 17.7626 8.28574 15.7123C6.23548 13.6621 6.23548 10.3379 8.28574 8.28769C10.336 6.23744 13.6601 6.23744 15.7104 8.28769Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  IconMoon:
    '<path d="M21.2481 11.8112C20.1889 12.5601 18.8958 13.0001 17.5 13.0001C13.9101 13.0001 11 10.0899 11 6.50006C11 5.10422 11.44 3.81114 12.1888 2.75195C12.126 2.75069 12.0631 2.75006 12 2.75006C6.89137 2.75006 2.75 6.89143 2.75 12.0001C2.75 17.1087 6.89137 21.2501 12 21.2501C17.1086 21.2501 21.25 17.1087 21.25 12.0001C21.25 11.937 21.2494 11.874 21.2481 11.8112Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
};

export type IconName = keyof typeof iconPaths | (string & {});

export const defaultIconStyle = {
  join: "round",
  fill: "outlined",
  radius: "0",
  stroke: "1.5",
} as const;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number | string;
  ariaLabel?: string;
  ariaHidden?: boolean;
  join?: string;
  fill?: string;
  radius?: string;
  stroke?: string;
}

function Icon({
  name,
  size = 24,
  ariaLabel,
  ariaHidden = true,
  className,
  style,
  join: _join,
  fill: _fill,
  radius: _radius,
  stroke: _stroke,
  ...props
}: IconProps) {
  const innerHtml = iconPaths[name] ?? "";

  return (
    <svg
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: statically defined internal SVG markup
      dangerouslySetInnerHTML={{ __html: innerHtml }}
      fill="none"
      height={typeof size === "number" ? `${size}px` : size}
      role={ariaHidden ? undefined : "img"}
      style={style}
      viewBox="0 0 24 24"
      width={typeof size === "number" ? `${size}px` : size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    />
  );
}

export type IconComponentProps = ComponentProps<typeof Icon>;

export { Icon };
