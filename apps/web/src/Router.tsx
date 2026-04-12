import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Header } from './components/Header/Header';
import { AskQuestion } from './pages/AskQuestion/AskQuestion';
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
        <Route path="/children" element={<MyChildren />} />
        <Route path="/tracker" element={<GrowthTracker />} />
        <Route path="/dosage" element={<DosageCalculator />} />
        <Route path="/visit-prep" element={<VisitPrep />} />
        <Route path="/ask" element={<AskQuestion />} />
      </Routes>
    </BrowserRouter>
  );
};
