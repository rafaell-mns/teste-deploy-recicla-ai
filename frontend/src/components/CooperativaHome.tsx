import React, { useState } from 'react';
import './CooperativaHome.css'; 
import { FaTruck, FaUser, FaMapMarkerAlt, FaCheckCircle, FaBoxOpen, FaClock, FaClipboardCheck } from 'react-icons/fa';
import apiFetch from '../apiFetch'; // Importe seu apiFetch
import ModalAvaliacao from './ModalAvaliacao'; // Importe o Modal

// MOCK DE DADOS (Se já tiver usando API, mantenha sua lógica de useEffect)
const MOCK_ENTREGAS_PENDENTES = [
  {
    id: 101,
    status: 'AGUARDANDO',
    horario_chegada: 'Há 5 minutos',
    coletor: { nome: 'Carlos Oliveira', veiculo: 'Caminhão VUC', telefone: '(86) 99999-1111' },
    produtor: { nome: 'Mercadinho do João', endereco: 'Rua das Flores, 123' },
    itens: [{ tipo: 'Papelão', quantidade: '50kg' }]
  },
  // ... outros dados
];

const CooperativaHome = () => {
  const [entregas, setEntregas] = useState(MOCK_ENTREGAS_PENDENTES);
  
  // ESTADOS DO MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState<any>(null);

  // 1. Quando clica no botão "Confirmar Recebimento"
  const handleClickConfirmar = (entrega: any) => {
    setEntregaSelecionada(entrega);
    setModalAberto(true); // Abre o modal
  };

  // 2. Quando clica em "Enviar Avaliação" dentro do modal
  const handleConfirmarFinal = async (nota: number) => {
    if (!entregaSelecionada) return;

    console.log(`Enviando nota ${nota} para o coletor da entrega ${entregaSelecionada.id}`);

    try {
      // AQUI VAI A CHAMADA PRO BACKEND (Exemplo):
      // await apiFetch.request(`/api/coletas/${entregaSelecionada.id}/avaliar/coletor/`, 'POST', { nota });
      // await apiFetch.request(`/api/coletas/${entregaSelecionada.id}/status/`, 'PATCH', { status: 'CONCLUIDA' });

      alert(`Entrega confirmada! Você avaliou o coletor com nota ${nota}.`);
      
      // Remove da lista visualmente
      setEntregas(prev => prev.filter(item => item.id !== entregaSelecionada.id));
      
      // Fecha modal
      setModalAberto(false);
      setEntregaSelecionada(null);
    } catch (error) {
      alert("Erro ao confirmar.");
    }
  };

  return (
    <div className="coop-container">
      <div className="coop-header">
        <h1><FaClipboardCheck style={{ marginRight: '10px' }}/>Recebimento de Entregas</h1>
        <p>Confirme a chegada dos coletores e avalie o serviço.</p>
      </div>

      {entregas.length === 0 ? (
        <div className="empty-state"><p>Sem entregas pendentes.</p></div>
      ) : (
        <div className="entregas-list">
          {entregas.map((entrega) => (
            <div className="entrega-card" key={entrega.id}>
              {/* ... (Cabeçalho e Corpo do Card mantidos iguais) ... */}
              <div className="card-header">
                 <div className="status-badge"><FaTruck /> Aguardando Confirmação</div>
                 <div className="time-badge"><FaClock /> {entrega.horario_chegada}</div>
              </div>
              
              <div className="card-body">
                 <div className="info-section">
                    <h4><FaUser /> Coletor</h4>
                    <p><strong>{entrega.coletor.nome}</strong></p>
                    <p>{entrega.coletor.veiculo}</p>
                 </div>
                 <div className="info-section">
                    <h4><FaBoxOpen /> Carga</h4>
                    <p>{entrega.itens.map(i => i.tipo).join(', ')}</p>
                 </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-confirmar" 
                  onClick={() => handleClickConfirmar(entrega)} // <--- MUDOU AQUI
                >
                  <FaCheckCircle /> Confirmar e Avaliar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* O MODAL FICA AQUI, FORA DO LOOP */}
      <ModalAvaliacao 
        isOpen={modalAberto}
        titulo="Avaliar Coletor"
        subtitulo={`Como foi a entrega de ${entregaSelecionada?.coletor?.nome}?`}
        onConfirmar={handleConfirmarFinal}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
};

export default CooperativaHome;