import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Cotizador from '@/pages/Cotizador';
import Certificados from '@/pages/Certificados';
import CertificadoDetail from '@/pages/CertificadoDetail';
import Liquidaciones from '@/pages/Liquidaciones';
import CasosMora from '@/pages/CasosMora';
import CasoMoraDetail from '@/pages/CasoMoraDetail';
import NuevoCasoMora from '@/pages/NuevoCasoMora';
import Configuracion from '@/pages/Configuracion';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cotizador" element={<Cotizador />} />
        <Route path="/certificados" element={<Certificados />} />
        <Route path="/certificados/:id" element={<CertificadoDetail />} />
        <Route path="/liquidaciones" element={<Liquidaciones />} />
        <Route path="/casos-mora" element={<CasosMora />} />
        <Route path="/casos-mora/nuevo" element={<NuevoCasoMora />} />
        <Route path="/casos-mora/nuevo/:id" element={<NuevoCasoMora />} />
        <Route path="/casos-mora/:id" element={<CasoMoraDetail />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App