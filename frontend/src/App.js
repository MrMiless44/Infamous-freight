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
import AnalyticsPage from "@/pages/AnalyticsPage";
import CalculatorPage from "@/pages/CalculatorPage";
import LanePreferencesPage from "@/pages/LanePreferencesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import AssignmentDetailPage from "@/pages/AssignmentDetailPage";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0b10]">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              
              {/* Load Routes */}
              <Route path="/loads" element={<LoadsPage />} />
              <Route path="/loads/new" element={<NewLoadPage />} />
              <Route path="/loads/my" element={<LoadsPage />} />
              <Route path="/loads/:id" element={<LoadDetailPage />} />
              
              {/* User Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/bids/my" element={<DashboardPage />} />
              
              {/* Assignment Routes */}
              <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
              
              {/* Tools & Features */}
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/preferences" element={<LanePreferencesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* Payments */}
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/success" element={<PaymentsPage />} />
              <Route path="/payments/cancel" element={<PaymentsPage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
