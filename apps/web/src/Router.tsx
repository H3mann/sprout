import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Header } from './components/Header/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AskQuestion } from './pages/AskQuestion/AskQuestion';
import { AuthPage } from './pages/Auth/AuthPage';
import { DosageCalculator } from './pages/DosageCalculator/DosageCalculator';
import { GrowthTracker } from './pages/GrowthTracker/GrowthTracker';
import { Home } from './pages/Home/Home';
import { MyChildren } from './pages/MyChildren/MyChildren';
import { VisitPrep } from './pages/VisitPrep/VisitPrep';

export const Router = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/children" element={<ProtectedRoute><MyChildren /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><GrowthTracker /></ProtectedRoute>} />
        <Route path="/dosage" element={<ProtectedRoute><DosageCalculator /></ProtectedRoute>} />
        <Route path="/visit-prep" element={<ProtectedRoute><VisitPrep /></ProtectedRoute>} />
        <Route path="/ask" element={<ProtectedRoute><AskQuestion /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};
