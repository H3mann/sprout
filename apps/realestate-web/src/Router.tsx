import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Header } from './components/Header/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { About } from './pages/About/About';
import { AuthCallback } from './pages/Auth/AuthCallback';
import { AuthPage } from './pages/Auth/AuthPage';
import { DealAnalyzer } from './pages/DealAnalyzer/DealAnalyzer';
import { DealStrategy } from './pages/DealStrategy/DealStrategy';
import { Home } from './pages/Home/Home';
import { Neighborhood } from './pages/Neighborhood/Neighborhood';
import { SavedSearches } from './pages/SavedSearches/SavedSearches';

export const Router = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/ai-discovery" element={<Navigate to="/" replace />} />
        <Route path="/neighborhood" element={<Neighborhood />} />
        <Route path="/deal-analyzer" element={<ProtectedRoute><DealAnalyzer /></ProtectedRoute>} />
        <Route path="/deal-strategy" element={<ProtectedRoute><DealStrategy /></ProtectedRoute>} />
        <Route path="/deal-strategy/:strategyKey" element={<ProtectedRoute><DealStrategy /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedSearches /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};
