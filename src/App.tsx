import { Routes, Route } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/admin/AdminPage';
import { ClueForm } from './pages/admin/ClueForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/new" element={<ClueForm />} />
      <Route path="/admin/edit/:id" element={<ClueForm />} />
    </Routes>
  );
}

export default App;
