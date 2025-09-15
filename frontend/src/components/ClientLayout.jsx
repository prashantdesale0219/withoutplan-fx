"use client";
import { usePathname } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import ErrorBoundary from "./common/ErrorBoundary";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard') || 
                     pathname?.includes('/models');
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  return (
    <ErrorBoundary>
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
      />
    </ErrorBoundary>
  );
}