import React from 'react';
import './Solicitacoes.css'; // Reutiliza o CSS da lista de solicitações
import { FaCheckCircle } from 'react-icons/fa';

// Dados de exemplo
const mockEntregasPendentes = [
  { id: 'e001', coletaId: 'c002', coletor: 'Carlos Coletor', dataChegada: '2025-10-22', itens: ['Papel', 'Metal'] },
  { id: 'e002', coletaId: 'c005', coletor: 'João Silva', dataChegada: '2025-10-22', itens: ['Plástico'] },
  { id: 'e003', coletaId: 'c007', coletor: 'Carlos Coletor', dataChegada: '2025-10-21', itens: ['Vidro', 'Metal'] },
];

const GerenciarEntregas = () => {

  const handleConfirmarEntrega = (entregaId: string) => {
    // Lógica para chamar a API e confirmar o recebimento
    console.log(`Confirmando recebimento da entrega ${entregaId}...`);
    alert(`Entrega ${entregaId} confirmada com sucesso!`);
    // Aqui, idealmente, a lista seria atualizada após a confirmação
  };

  return (
    <div className="solicitacoes-container"> {/* Reutilizando a classe container */}
      <h1>Confirmar Recebimento de Entregas</h1>
      <p>Confirme as entregas realizadas pelos coletores na sua cooperativa.</p>

      <table className="solicitacoes-table"> {/* Reutilizando a classe da tabela */}
        <thead>
          <tr>
            <th>ID Entrega</th>
            <th>ID Coleta Original</th>
            <th>Coletor</th>
            <th>Data Chegada</th>
            <th>Materiais (Resumo)</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {mockEntregasPendentes.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center' }}>Nenhuma entrega pendente.</td>
            </tr>
          ) : (
            mockEntregasPendentes.map(entrega => (
              <tr key={entrega.id}>
                <td>{entrega.id}</td>
                <td>{entrega.coletaId}</td>
                <td>{entrega.coletor}</td>
                <td>{new Date(entrega.dataChegada).toLocaleDateString('pt-BR')}</td>
                <td>{entrega.itens.join(', ')}</td>
                <td>
                  <button 
                    className="action-button confirm-button" 
                    onClick={() => handleConfirmarEntrega(entrega.id)}
                  >
                    <FaCheckCircle /> Confirmar Recebimento
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GerenciarEntregas;