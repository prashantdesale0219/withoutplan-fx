"use client";
import { usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import ErrorBoundary from "./common/ErrorBoundary";
import { CreditProvider } from "../contexts/CreditContext";
import { AuthProvider } from "../contexts/AuthContext";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard') || pathname?.includes('/admin/users') ||       pathname?.includes('/admin/plans') ||
                     pathname?.includes('/models') || pathname?.includes('/admin/analytics') || pathname?.includes('/admin/dashboard') || pathname?.includes('/admin/settings') || pathname?.includes('/admin/environment');
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CreditProvider>
          {!isDashboard && !isAuthPage && <Navbar />}
          {children}
          {!isDashboard && !isAuthPage && <Footer />}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            limit={5}
            containerId="main-toast-container"
          />
        </CreditProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}