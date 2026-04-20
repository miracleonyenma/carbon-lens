import { PageHeader } from "@/components/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/providers/auth-guard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div>
        <SidebarProvider>
          <div className="hidden md:block">{/* <AppSidebar /> */}</div>
          <SidebarInset>
            <PageHeader
              options={{
                showNavUser: true,
                showSearch: true,
                showThemeToggle: true,
              }}
            />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}
