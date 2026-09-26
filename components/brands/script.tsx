interface ScriptProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Script = ({ height = "26px", className }: ScriptProps) => {
  return (
    <svg
      className={className}
      fill="none"
      height={height}
      viewBox="0 0 76 26"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Script</title>
      <svg
        aria-hidden="true"
        height="22"
        viewBox="0 0 24 24"
        width="22"
        x="1"
        y="2"
      >
        <path
          d="M4 4.5l6.5 6.5L4 17.5l2 2 8.5-8.5L6 2.5 4 4.5zm10 13h8v2.5h-8V17.5z"
          fill="currentColor"
        />
      </svg>
      <text
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontSize="15.5"
        fontWeight="600"
        letterSpacing="-0.02em"
        x="28"
        y="13.5"
      >
        Script
      </text>
    </svg>
  );
};
