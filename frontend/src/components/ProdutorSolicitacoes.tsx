import React, { useEffect, useState } from 'react';
import './Solicitacoes.css'; // Novo CSS para esta tela
import apiFetch from '../apiFetch';

type Solicitacao = {
  id: string;
  data?: string;
  solicitacao?: string;
  inicio_coleta?: string;
  fim_coleta?: string;
  status?: string;
  status_display?: string;
  coletor?: string | null;
  coletor_nome?: string | null;
  itens?: number;
  itens_count?: number;
};

const ProdutorSolicitacoes = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSolicitacoes() {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiFetch.request('/api/coletas/minhas/');
      if (!resp.ok) throw new Error(`Erro na requisição: ${resp.status}`);
      const data = await resp.json();
      // assumir que o backend retorna um array de solicitações
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar solicitações');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const formatDateTimeOffset = (value?: string | number | null, hoursToSubtract = 0) => {
    if (!value) return '—';
    const d = new Date(value as any);
    if (isNaN(d.getTime())) return '—';
    d.setHours(d.getHours() + hoursToSubtract);
    const date = d.toLocaleDateString('pt-BR');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${date} ${hours}h${minutes}`;
  };

  async function handleCancelar(_id: string) {
    if (!window.confirm('Confirma cancelar e remover esta solicitação?')) return;
    try {
      const resp = await apiFetch.request(`/api/coletas/${_id}/`, 'DELETE');
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Erro ao cancelar: ${resp.status} ${errText}`);
      }
      // remover da lista local para feedback instantâneo
      setSolicitacoes(prev => prev.filter(s => s.id !== _id));
    } catch (err: any) {
      alert(err.message || 'Erro desconhecido ao cancelar solicitação');
    }
  }

  return (
    <div className="solicitacoes-container">
      <h1>Minhas Solicitações de Coleta</h1>
      <p>Acompanhe o status das suas solicitações recentes.</p>

      {loading ? (
        <p>Carregando solicitações...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Erro: {error}</p>
      ) : (
        <table className="solicitacoes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Status</th>
              <th>Coletor</th>
              <th>Itens</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada.</td>
              </tr>
            ) : (
              solicitacoes.map(sol => (
                <tr key={sol.id}>
                  <td>{sol.id}</td>
                  <td>{formatDateTimeOffset(sol.solicitacao || sol.inicio_coleta || sol.fim_coleta || Date.now(), -3)}</td>
                  <td>
                    <span className={`status-badge status-${(sol.status || '').toString().toLowerCase().replace(' ', '-')}`}>
                      {sol.status_display || sol.status}
                    </span>
                  </td>
                  <td>{sol.coletor_nome || '-'}</td>
                  <td>{sol.itens_count ?? '-'}</td>
                  <td>
                    <button className="action-button details-button">Detalhes</button>
                    {sol.status === 'SOLICITADA' && (
                      <button className="action-button cancel-button" onClick={() => handleCancelar(sol.id)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProdutorSolicitacoes;