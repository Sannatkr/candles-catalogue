import { AdminNav } from "@/components/admin/admin-nav";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas-deep/40">
      <AdminNav />
      <div className="mx-auto max-w-[980px] px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}
