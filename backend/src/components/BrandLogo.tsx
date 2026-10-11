import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
  horizontal?: boolean;
  variant?: "light" | "dark";
};

export function BrandLogo({
  size = 40,
  showText = true,
  subtitle = "Exam App",
  className,
  horizontal = false,
  variant = "light",
}: BrandLogoProps) {
  const titleClass = variant === "light" ? "text-white" : "text-slate-900";
  const subtitleClass = variant === "light" ? "text-indigo-300" : "text-slate-500";

  if (horizontal) {
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          src="/logo-horizontal.png"
          alt="Astraa"
          width={238}
          height={48}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/logo-icon.png"
        alt="Astraa"
        width={size}
        height={size}
        className="rounded-2xl bg-white shadow-lg shadow-indigo-500/20"
        style={{ width: size, height: size }}
        priority
      />
      {showText && (
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", titleClass)}>Astraa</h1>
          {subtitle && <p className={cn("text-xs", subtitleClass)}>{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
