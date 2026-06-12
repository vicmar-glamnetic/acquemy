import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <header className="sticky top-0 z-30 h-14 flex items-center justify-end gap-2 px-6 border-b border-border bg-background/80 backdrop-blur-md">
          <UserMenu />
        </header>
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
