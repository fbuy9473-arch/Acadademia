import Image from "next/image";

export function Logo({ className = "h-11 w-auto" }: { className?: string }) {
  return (
    <Image src="/brand/logo-provisorio.png" alt="Academia Tchamile" width={140} height={62} className={className} priority />
  );
}
