import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  titulo: string;
  subtitulo: string;
  onConfirmar: (nota: number) => void;
  onFechar: () => void;
}

const ModalAvaliacao: React.FC<ModalProps> = ({ isOpen, titulo, subtitulo, onConfirmar, onFechar }) => {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (nota > 0) {
      onConfirmar(nota);
      setNota(0); // Reseta para a próxima vez
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center',
        width: '90%', maxWidth: '400px', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
      }}>
        <button onClick={onFechar} style={{
          position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
          fontSize: '1.2rem', cursor: 'pointer', color: '#777'
        }}>
          <FaTimes />
        </button>
        
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>{titulo}</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>{subtitulo}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={35}
              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              color={star <= (hover || nota) ? "#ffc107" : "#e4e5e9"}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setNota(star)}
            />
          ))}
        </div>

        <button 
          onClick={handleConfirmar}
          disabled={nota === 0}
          style={{
            background: nota === 0 ? '#ccc' : 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
            color: 'white', border: 'none', padding: '12px 25px',
            borderRadius: '8px', fontWeight: 'bold', cursor: nota === 0 ? 'not-allowed' : 'pointer',
            width: '100%', fontSize: '1rem', transition: 'all 0.3s'
          }}
        >
          Enviar Avaliação
        </button>
      </div>
    </div>
  );
};

export default ModalAvaliacao;