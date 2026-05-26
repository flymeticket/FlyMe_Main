import { SiteNav } from '@/components/layout/SiteNav';
import { SiteFooter } from '@/components/layout/SiteFooter';

// Shared chrome for every page — top nav and footer wrap the route group's
// children. The route group `(content)` doesn't affect URLs; pages still live
// at their original paths (e.g. /routes/bom/del/...). It only scopes which
// pages get the SiteNav + SiteFooter.

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
