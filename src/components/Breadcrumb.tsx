import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span className="breadcrumb-separator">›</span>}
            {isLast ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <Link href={item.href} className="breadcrumb-item">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
