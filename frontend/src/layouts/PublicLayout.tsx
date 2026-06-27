import { Outlet } from "react-router-dom";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="min-h-[calc(100vh-8rem)] px-4 py-8 md:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
