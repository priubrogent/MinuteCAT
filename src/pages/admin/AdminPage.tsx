import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClueData } from '../../types';
import {
  getClues,
  removeClue,
  adminLogin,
  adminLogout,
  checkAdminAuth,
  exportCluesJson,
  importCluesJson,
} from '../../store/clueStore';
import './admin.css';

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(pw)) {
      onLogin();
    } else {
      setError(true);
      setPw('');
    }
  };

  return (
    <div className="admin-login">
      <h1 className="admin-login-title">Admin</h1>
      <p className="admin-login-sub">Minut Críptic</p>
      <form onSubmit={handleSubmit} className="admin-login-form">
        <input
          type="password"
          placeholder="contrasenya"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          className={`admin-input${error ? ' admin-input--error' : ''}`}
          autoFocus
        />
        {error && <p className="admin-error-msg">Contrasenya incorrecta</p>}
        <button type="submit" className="admin-btn admin-btn--primary">
          Entrar
        </button>
      </form>
    </div>
  );
}

function clueStatus(clue: ClueData): { label: string; cls: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (!clue.date) return { label: 'Sense data', cls: 'badge--grey' };
  if (clue.date > today) return { label: 'Programada', cls: 'badge--blue' };
  if (clue.date === today) return { label: 'Avui', cls: 'badge--green' };
  return { label: 'Passada', cls: 'badge--grey' };
}

function Dashboard() {
  const navigate = useNavigate();
  const [clues, setClues] = useState<ClueData[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const loadClues = () => {
    getClues().then((c) =>
      setClues([...c].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')))
    );
  };

  useEffect(() => { loadClues(); }, []);

  const handleDelete = (id: string) => {
    removeClue(id).then(() => {
      setDeleteConfirm(null);
      loadClues();
    });
  };

  const handleExport = () => {
    exportCluesJson().then((json) => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'minutecat-clues.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImport = () => {
    try {
      importCluesJson(importText)
        .then(() => {
          loadClues();
          setShowImport(false);
          setImportText('');
          setImportError('');
        })
        .catch(() => setImportError('Error al importar'));
    } catch {
      setImportError('JSON invàlid');
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const scheduled = clues.filter((c) => c.date && c.date >= today).length;
  const past = clues.filter((c) => c.date && c.date < today).length;

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Admin</h1>
          <p className="admin-subtitle">Minut Críptic</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn--ghost" onClick={handleExport}>
            Exporta JSON
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={() => setShowImport(true)}>
            Importa JSON
          </button>
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => { adminLogout(); window.location.reload(); }}
          >
            Surt
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-value">{clues.length}</span>
          <span className="stat-label">Total pistes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{scheduled}</span>
          <span className="stat-label">Programades</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{past}</span>
          <span className="stat-label">Passades</span>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Pistes</h2>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => navigate('/admin/new')}
          >
            + Nova pista
          </button>
        </div>

        {clues.length === 0 ? (
          <p className="admin-empty">No hi ha cap pista. Crea'n una!</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Pista</th>
                  <th>Resposta</th>
                  <th>Par</th>
                  <th>Estat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clues.map((clue) => {
                  const status = clueStatus(clue);
                  const preview = clue.parts.map((p) => p.text).join('').trim();
                  return (
                    <tr key={clue.id}>
                      <td className="admin-td-date">
                        {clue.date || <span className="muted">—</span>}
                      </td>
                      <td className="admin-td-clue" title={preview}>
                        {preview.length > 48 ? preview.slice(0, 48) + '…' : preview}
                      </td>
                      <td className="admin-td-answer">{clue.answer}</td>
                      <td className="admin-td-par">{clue.par}</td>
                      <td>
                        <span className={`badge ${status.cls}`}>{status.label}</span>
                      </td>
                      <td className="admin-td-actions">
                        <button
                          className="admin-btn admin-btn--sm admin-btn--ghost"
                          onClick={() => navigate(`/admin/edit/${clue.id}`)}
                        >
                          Edita
                        </button>
                        {deleteConfirm === clue.id ? (
                          <>
                            <button
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => handleDelete(clue.id)}
                            >
                              Confirma
                            </button>
                            <button
                              className="admin-btn admin-btn--sm admin-btn--ghost"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel·la
                            </button>
                          </>
                        ) : (
                          <button
                            className="admin-btn admin-btn--sm admin-btn--ghost admin-btn--red"
                            onClick={() => setDeleteConfirm(clue.id)}
                          >
                            Elimina
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showImport && (
        <div className="admin-modal-overlay" onClick={() => setShowImport(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Importa JSON</h3>
            <p className="admin-modal-sub">Enganxa el JSON de pistes. Sobreescriurà les actuals.</p>
            <textarea
              className="admin-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder='[{"id": "...", ...}]'
            />
            {importError && <p className="admin-error-msg">{importError}</p>}
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setShowImport(false)}>
                Cancel·la
              </button>
              <button className="admin-btn admin-btn--primary" onClick={handleImport}>
                Importa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(checkAdminAuth);

  if (!authed) {
    return <LoginGate onLogin={() => setAuthed(true)} />;
  }
  return <Dashboard />;
}
