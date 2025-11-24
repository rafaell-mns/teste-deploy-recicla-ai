import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa'; // Certifique-se de ter react-icons instalado

interface Props {
  nomeColetor: string;
  onAvaliar: (nota: number) => void;
  onFechar: () => void;
}

const AvaliacaoColetor: React.FC<Props> = ({ nomeColetor, onAvaliar, onFechar }) => {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);

  const handleSubmit = () => {
    if (nota > 0) {
      onAvaliar(nota);
    }
  };

  return (
    <div className="avaliacao-modal" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px' }}>
      <h3>Avaliar {nomeColetor}</h3>
      
      <div className="estrelas-container" style={{ margin: '20px 0' }}>
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <label key={index}>
              <input 
                type="radio" 
                name="rating" 
                value={ratingValue} 
                onClick={() => setNota(ratingValue)}
                style={{ display: 'none' }}
              />
              <FaStar 
                className="star" 
                color={ratingValue <= (hover || nota) ? "#ffc107" : "#e4e5e9"} 
                size={30}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(0)}
                style={{ cursor: 'pointer' }}
                // O aria-label é CRUCIAL para o teste encontrar este elemento específico
                aria-label={`${ratingValue} estrelas`}
              />
            </label>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onFechar} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px' }}>
          Cancelar
        </button>
        <button 
          onClick={handleSubmit}
          style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          Enviar Avaliação
        </button>
      </div>
    </div>
  );
};

export default AvaliacaoColetor;