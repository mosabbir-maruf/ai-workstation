interface NextjsProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Nextjs = ({ height = "26px", className }: NextjsProps) => {
  return (
    <svg
      className={className}
      fill="none"
      height={height}
      viewBox="0 0 86 26"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Next.js</title>
      <svg
        aria-hidden="true"
        height="23"
        viewBox="0 0 24 24"
        width="23"
        x="1"
        y="1.5"
      >
        <path
          clipRule="evenodd"
          d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
      <text
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontSize="15.5"
        fontWeight="600"
        letterSpacing="-0.02em"
        x="30"
        y="13.5"
      >
        Next.js
      </text>
    </svg>
  );
};
