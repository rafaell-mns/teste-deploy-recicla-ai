import React from 'react';
import { FaStar, FaUser, FaCalendarAlt } from 'react-icons/fa';

interface AvaliacaoItem {
  id: number;
  data: string;
  autor: string; // Quem avaliou
  nota: number;
  comentario?: string; // Opcional
}

interface HistoricoProps {
  titulo: string;
  avaliacoes: AvaliacaoItem[];
}

const HistoricoAvaliacoes: React.FC<HistoricoProps> = ({ titulo, avaliacoes }) => {
  
  // Função auxiliar para renderizar estrelas estáticas
  const renderEstrelas = (nota: number) => {
    return [...Array(5)].map((_, index) => (
      <FaStar 
        key={index} 
        size={16} 
        color={index < nota ? "#ffc107" : "#e4e5e9"} 
      />
    ));
  };

  return (
    <div className="historico-avaliacoes-container" style={{ 
      background: '#fff', padding: '20px', borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '20px' 
    }}>
      <h3 style={{ color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
        {titulo}
      </h3>

      {avaliacoes.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Nenhuma avaliação encontrada.</p>
      ) : (
        <div className="lista-avaliacoes" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {avaliacoes.map((item) => (
            <div key={item.id} className="avaliacao-card" style={{ 
              border: '1px solid #f0f0f0', borderRadius: '8px', padding: '15px', background: '#f9f9f9' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#555' }}>
                  <FaUser size={14} /> {item.autor}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt size={12} /> {item.data}
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                {renderEstrelas(item.nota)}
                <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#333' }}>{item.nota.toFixed(1)}</span>
              </div>

              {item.comentario && (
                <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', margin: 0 }}>
                  "{item.comentario}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoAvaliacoes;