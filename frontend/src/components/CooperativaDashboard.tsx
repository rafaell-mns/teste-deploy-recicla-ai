import React, { useState } from 'react';
import './CooperativaHome.css'; 
import { FaHistory, FaSearch, FaCalendarAlt, FaUser, FaBox, FaCheckCircle, FaTimesCircle, FaStar, FaListAlt } from 'react-icons/fa';
import HistoricoAvaliacoes from './HistoricoAvaliacoes';

// MOCK (Avaliações que a Cooperativa DEU para os Coletores)
const MOCK_AVALIACOES_DADAS = [
  { id: 101, data: '19/11/2025', autor: 'Você (para Carlos Coletor)', nota: 5, comentario: 'Tudo certo com a carga, material bem separado.' },
  { id: 102, data: '18/11/2025', autor: 'Você (para Maria Santos)', nota: 4, comentario: 'Atrasou um pouco, mas material ok.' },
  { id: 103, data: '15/11/2025', autor: 'Você (para João da Silva)', nota: 2, comentario: 'Material veio sujo e misturado.' },
];

// MOCK (Histórico Operacional de Entregas)
const MOCK_HISTORICO = [
  {
    id: 501,
    data: '19/11/2025 14:30',
    coletor: 'Carlos Oliveira',
    veiculo: 'Caminhão VUC - ABC-1234',
    itens: ['Papelão (50kg)', 'Plástico (20kg)'],
    status: 'CONCLUIDA',
    observacao: 'Recebido conforme o combinado.'
  },
  {
    id: 502,
    data: '19/11/2025 10:15',
    coletor: 'Maria Santos',
    veiculo: 'Fiat Fiorino - XYZ-9876',
    itens: ['Vidro (30kg)', 'Metal (10kg)'],
    status: 'CONCLUIDA',
    observacao: ''
  },
  {
    id: 498,
    data: '18/11/2025 16:45',
    coletor: 'João da Silva',
    veiculo: 'Kombi - KLJ-4567',
    itens: ['Eletrônicos (5un)'],
    status: 'REJEITADA',
    observacao: 'Material misturado com lixo orgânico. Impróprio para reciclagem.'
  }
];

const CooperativaDashboard = () => {
  // Estado da Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'avaliacoes'>('historico');
  const [filtro, setFiltro] = useState('');

  // Filtra histórico operacional
  const historicoFiltrado = MOCK_HISTORICO.filter(item => 
    item.coletor.toLowerCase().includes(filtro.toLowerCase()) ||
    item.id.toString().includes(filtro)
  );

  return (
    <div className="coop-container">
      {/* CABEÇALHO */}
      <div className="coop-header">
        <h1><FaHistory style={{ marginRight: '10px' }}/> Painel de Controle</h1>
        <p>Gerencie o histórico de operações e a qualidade dos parceiros.</p>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('historico')}
        >
          <FaListAlt /> Histórico Operacional
        </button>
        <button 
          className={`tab-btn ${abaAtiva === 'avaliacoes' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('avaliacoes')}
        >
          <FaStar /> Avaliações Enviadas
        </button>
      </div>

      {/* CONTEÚDO DA ABA: HISTÓRICO OPERACIONAL */}
      {abaAtiva === 'historico' && (
        <>
          {/* BARRA DE FILTRO */}
          <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{ position: 'absolute', left: '15px', top: '14px', color: '#999' }} />
              <input 
                type="text" 
                placeholder="Buscar entrega por coletor ou ID..." 
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{
                  width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px',
                  border: '1px solid #ddd', fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div className="entregas-list">
            {historicoFiltrado.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum registro encontrado.</p>
              </div>
            ) : (
              historicoFiltrado.map((item) => (
                <div className="entrega-card" key={item.id} style={{ borderLeft: item.status === 'REJEITADA' ? '5px solid #dc3545' : '5px solid #28a745' }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#555' }}>#{item.id}</span>
                      {item.status === 'CONCLUIDA' ? (
                        <span className="status-badge" style={{ background: '#d4edda', color: '#155724' }}>
                          <FaCheckCircle /> Concluída
                        </span>
                      ) : (
                        <span className="status-badge" style={{ background: '#f8d7da', color: '#721c24' }}>
                          <FaTimesCircle /> Rejeitada
                        </span>
                      )}
                    </div>
                    <div className="time-badge"><FaCalendarAlt /> {item.data}</div>
                  </div>

                  <div className="card-body" style={{ paddingBottom: '15px' }}>
                    <div className="info-section">
                      <h4 style={{ fontSize: '0.95rem', color: '#777' }}>COLETOR</h4>
                      <div className="info-row" style={{ fontSize: '1.1rem', color: '#333', fontWeight: '600' }}>
                        <FaUser style={{ color: '#555' }} /> {item.coletor}
                      </div>
                      <div className="info-row" style={{ fontSize: '0.9rem' }}><small>{item.veiculo}</small></div>
                    </div>

                    <div className="info-section">
                      <h4 style={{ fontSize: '0.95rem', color: '#777' }}>CARGA</h4>
                      <div className="info-row">
                        <FaBox style={{ color: '#555' }} /> 
                        <span>{item.itens.join(', ')}</span>
                      </div>
                      {item.observacao && (
                        <div style={{ marginTop: '10px', background: '#fff3cd', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', color: '#856404' }}>
                          <strong>Obs:</strong> {item.observacao}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* CONTEÚDO DA ABA: AVALIAÇÕES */}
      {abaAtiva === 'avaliacoes' && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ color: '#2c3e50', fontSize: '1.4rem', marginBottom: '15px', textAlign: 'center' }}>
            Qualidade dos Coletores
          </h2>
          <p style={{ color: '#777', marginBottom: '30px', textAlign: 'center' }}>
            Histórico das notas que sua cooperativa atribuiu após cada entrega.
          </p>
          
          <HistoricoAvaliacoes 
              titulo="Avaliações Recentes Enviadas" 
              avaliacoes={MOCK_AVALIACOES_DADAS} 
          />
        </div>
      )}
    </div>
  );
};

export default CooperativaDashboard;