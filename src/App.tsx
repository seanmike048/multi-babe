
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import IndexPage from './pages/Index';
import Rulebook from './pages/Rulebook';
import MultiPage from './pages/Multi';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/rulebook" element={<Rulebook />} />
        <Route path="/multi" element={<MultiPage />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" richColors />
    </BrowserRouter>
  );
}
