export default function Bottle({
  brand = "NOIR",
  name = "EAU DE PARFUM",
  variant = 0,
}: {
  brand?: string;
  name?: string;
  variant?: number;
}) {
  const dark = variant % 3 !== 2;
  return (
    <svg
      viewBox="0 0 300 340"
      role="img"
      aria-label={name + " — nümunə flakon təsviri"}
    >
      <defs>
        <linearGradient id={"glass" + variant}>
          <stop stopColor={dark ? "#101010" : "#bbb"} />
          <stop offset=".35" stopColor={dark ? "#414141" : "#fafafa"} />
          <stop offset=".65" stopColor={dark ? "#171717" : "#ddd"} />
          <stop offset="1" stopColor={dark ? "#080808" : "#aaa"} />
        </linearGradient>
        <filter id={"shadow" + variant}>
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <ellipse
        cx="150"
        cy="307"
        rx="80"
        ry="10"
        fill="#000"
        opacity=".15"
        filter={"url(#shadow" + variant + ")"}
      />
      <rect x="116" y="33" width="68" height="56" rx="5" fill="#141414" />
      <path d="M120 37h60v2h-60zM120 78h60v2h-60z" fill="#777" />
      <rect x="123" y="88" width="54" height="15" fill="#777" />
      <rect
        x="72"
        y="103"
        width="156"
        height="193"
        rx={variant % 2 ? 8 : 23}
        fill={"url(#glass" + variant + ")"}
        stroke="#777"
        strokeWidth=".7"
      />
      <path
        d="M83 127v144M216 125v148"
        stroke="#fff"
        opacity=".17"
        strokeWidth="3"
      />
      <rect
        x="86"
        y="160"
        width="128"
        height="85"
        fill={variant % 2 ? "#e5e4e1" : "#171717"}
        stroke="#888"
        strokeWidth=".5"
      />
      <text
        x="150"
        y="187"
        textAnchor="middle"
        fill={variant % 2 ? "#222" : "#eee"}
        fontFamily="Georgia"
        fontSize={brand.length > 12 ? 9 : 14}
        letterSpacing="1"
      >
        {brand.toUpperCase()}
      </text>
      <text
        x="150"
        y="210"
        textAnchor="middle"
        fill={variant % 2 ? "#333" : "#ddd"}
        fontFamily="Arial"
        fontSize={name.length > 17 ? 8 : 10}
      >
        {name.toUpperCase()}
      </text>
      <text
        x="150"
        y="230"
        textAnchor="middle"
        fill="#999"
        fontFamily="Arial"
        fontSize="6"
        letterSpacing="2"
      >
        EAU DE PARFUM
      </text>
    </svg>
  );
}
