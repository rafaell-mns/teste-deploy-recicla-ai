import React, { useEffect, useState } from 'react';
import './HomeContent.css'; 
import { FaStar } from 'react-icons/fa';
import HistoricoAvaliacoes from './HistoricoAvaliacoes';
import apiFetch from '../apiFetch'; // Importante: garanta que o caminho está certo

// Mock para o histórico (já que o backend ainda não salva o histórico detalhado, apenas a média)
const MOCK_HISTORICO = [
  { id: 1, data: '20/11/2025', autor: 'Sistema', nota: 5, comentario: 'Avaliação registrada.' },
  { id: 2, data: '18/11/2025', autor: 'Sistema', nota: 4, comentario: 'Avaliação registrada.' },
];

const ProdutorAvaliacoes = () => {
  const [notaMedia, setNotaMedia] = useState(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Busca os dados reais do perfil do produtor ao carregar a página
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await apiFetch.request('/api/produtor/perfil/', 'GET');
        if (response.ok) {
          const data = await response.json();
          // Atualiza o estado com os dados vindos do banco
          setNotaMedia(parseFloat(data.nota_avaliacao_atual) || 0);
          setTotalAvaliacoes(data.total_avaliacoes || 0);
        }
      } catch (error) {
        console.error("Erro ao carregar reputação:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  return (
    <div className="home-content">
      <h1>Minha Reputação</h1>
      <p>Veja como você está sendo avaliado pelos coletores e cooperativas.</p>

      {/* Card de Destaque da Nota */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ margin: 0, color: '#555', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Média Geral</h2>
        
        {loading ? (
            <p>Carregando...</p>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#2c3e50' }}>
                {notaMedia.toFixed(1)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ color: '#ffc107', fontSize: '1.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                        <FaStar key={i} color={i < Math.round(notaMedia) ? "#ffc107" : "#cbd3da"} />
                    ))}
                </div>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                    Baseado em {totalAvaliacoes} avaliações reais
                </span>
            </div>
            </div>
        )}
      </div>

      {/* Lista de Histórico (Aviso sobre limitação) */}
      <div style={{ opacity: 0.7 }}>
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
            * O histórico detalhado de comentários estará disponível em breve. Abaixo, dados de exemplo.
          </p>
          <HistoricoAvaliacoes 
            titulo="Histórico Completo (Exemplo)" 
            avaliacoes={MOCK_HISTORICO} 
          />
      </div>
    </div>
  );
};

export default ProdutorAvaliacoes;