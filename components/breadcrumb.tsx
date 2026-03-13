"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
            {isLast ? (
              <span className="font-medium text-amber-400">{item.label}</span>
            ) : (
              <button
                onClick={() => item.href && router.push(item.href)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
