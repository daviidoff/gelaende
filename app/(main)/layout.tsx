import NavBar from "@/components/tabs/navBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      {/* Main content with bottom padding to account for fixed navbar */}
      <main className="flex-1">{children}</main>

      {/* Navigation Bar */}
      <NavBar />
    </div>
  );
}
