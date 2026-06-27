import { Outlet } from "react-router-dom";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { Sidebar } from "@/components/navigation/Sidebar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="min-h-[calc(100vh-8rem)] flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
