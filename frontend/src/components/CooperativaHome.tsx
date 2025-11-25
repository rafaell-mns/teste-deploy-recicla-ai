import React, { useState, useEffect } from 'react';
import './CooperativaHome.css';
import { FaTruck, FaUser, FaMapMarkerAlt, FaCheckCircle, FaBoxOpen, FaClock, FaClipboardCheck } from 'react-icons/fa';
import apiFetch from '../apiFetch';
import ModalAvaliacao from './ModalAvaliacao';

const CooperativaHome = () => {
  const [entregas, setEntregas] = useState<any[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState<any>(null);

  // ================================
  // 1) BUSCAR ENTREGAS REAIS (API)
  // ================================
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch.request("/api/coletas/pendentes_cooperativa/");
        if (!resp || !resp.ok) {
          console.warn("Falha ao carregar entregas pendentes da cooperativa");
          setEntregas([]);
          return;
        }

        const data = await resp.json();
        const lista = Array.isArray(data)
          ? data
          : (data.results || data.data || []);

        setEntregas(lista);
      } catch (e) {
        console.error("Erro ao buscar entregas pendentes:", e);
        setEntregas([]);
      }
    })();
  }, []);

  // ================================
  // 2) ABRIR O MODAL
  // ================================
  const handleClickConfirmar = (entrega: any) => {
    setEntregaSelecionada(entrega);
    setModalAberto(true);
  };

  // ================================
  // 3) CONFIRMAR + AVALIAR COLETOR
  // ================================
  const handleConfirmarFinal = async (nota: number) => {
    if (!entregaSelecionada) return;

    const coletaId = entregaSelecionada.id;
    console.log(`Confirmando e avaliando coleta ${coletaId} com nota ${nota}`);

    try {
      // 1) Atualizar status para CONCLUIDA
      const respStatus = await apiFetch.request(
        `/api/coletas/${coletaId}/status/`,
        'PATCH',
        { status: 'CONCLUIDA' }
      );

      if (!respStatus.ok) {
        const errData = await respStatus.json().catch(() => null);
        console.warn("Erro ao atualizar status:", errData);
        alert("Erro ao confirmar a entrega no sistema.");
        return;
      }

      // 2) Avaliar o Coletor
      const respAvaliacao = await apiFetch.request(
        '/api/avaliar/coletor/',
        'POST',
        {
          coleta_id: coletaId,
          nota: nota,
          comentario: ""
        }
      );

      if (!respAvaliacao.ok) {
        const errData = await respAvaliacao.json().catch(() => null);
        console.warn("Erro ao salvar avaliação:", errData);
        alert("Entrega confirmada, mas houve um erro ao salvar a avaliação.");
      } else {
        alert(`Entrega confirmada e coletor avaliado com nota ${nota}!`);
      }

      // 3) Atualizar UI
      setEntregas(prev => prev.filter(item => item.id !== coletaId));

      // 4) Fechar modal
      setModalAberto(false);
      setEntregaSelecionada(null);

    } catch (error) {
      console.error(error);
      alert("Erro ao confirmar.");
    }
  };

  // ================================
  // 4) RENDER
  // ================================
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
              
              <div className="card-header">
                <div className="status-badge"><FaTruck /> Aguardando Confirmação</div>
                {/* Aqui usamos o horário do backend se existir */}
                <div className="time-badge"><FaClock /> {entrega.horario_chegada || 'Agora mesmo'}</div>
              </div>

              <div className="card-body">
                <div className="info-section">
                  <h4><FaUser /> Coletor</h4>
                  <p><strong>{entrega.coletor?.nome || "Coletor"}</strong></p>
                </div>

                <div className="info-section">
                  <h4><FaBoxOpen /> Carga</h4>
                  <p>
                    {entrega.itens?.map((i: any) => i.tipo_residuo || i.tipo).join(', ') ||
                     "Materiais não especificados"}
                  </p>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-confirmar"
                  onClick={() => handleClickConfirmar(entrega)}
                >
                  <FaCheckCircle /> Confirmar e Avaliar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
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