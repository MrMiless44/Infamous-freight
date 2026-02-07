import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

// Pages
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import LoadsPage from "@/pages/LoadsPage";
import NewLoadPage from "@/pages/NewLoadPage";
import LoadDetailPage from "@/pages/LoadDetailPage";
import MessagesPage from "@/pages/MessagesPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0b10]">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/loads" element={<LoadsPage />} />
              <Route path="/loads/new" element={<NewLoadPage />} />
              <Route path="/loads/my" element={<LoadsPage />} />
              <Route path="/loads/:id" element={<LoadDetailPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/bids/my" element={<DashboardPage />} />
              <Route path="/profile" element={<DashboardPage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
