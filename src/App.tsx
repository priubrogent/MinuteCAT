import { Routes, Route } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/admin/AdminPage';
import { ClueForm } from './pages/admin/ClueForm';
import { CrearPage } from './pages/CrearPage';
import { SharedGamePage } from './pages/SharedGamePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/crear" element={<CrearPage />} />
      <Route path="/p/:code" element={<SharedGamePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/new" element={<ClueForm />} />
      <Route path="/admin/edit/:id" element={<ClueForm />} />
    </Routes>
  );
}

export default App;
