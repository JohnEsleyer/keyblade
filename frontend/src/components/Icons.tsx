import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  fill: "none" as const,
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M12 16V4m0 0L7 9m5-5 5 5" />
    <path d="M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17" />
  </svg>
);

export const QrIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3M20 20v.01M17 20h.01M20 17h.01" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const MoreIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)} strokeWidth={2.2}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
    <path d="M9.5 12l1.8 1.8L14.5 10.5" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 15l-4.5-4.5L7 20" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 2.4 17.4A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <circle cx="8" cy="14" r="4" />
    <path d="M10.8 11.2 20 2m-3 0 3 3m-6 0 2 2" />
  </svg>
);
