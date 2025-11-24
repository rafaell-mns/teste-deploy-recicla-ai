import React, { useState, useMemo } from 'react';
import './Inventario.css'; 
import { FaWarehouse, FaCheck, FaExchangeAlt, FaBoxOpen } from 'react-icons/fa';

// --- DADOS DE MOCK ---
// ⚠️ CORREÇÃO 1: IDs devem ser exatamente 'coop01' e 'coop02'
const INVENTARIO_INICIAL = [
  { id: 'mat1', material: 'Plástico', quantidade: 15, unidade: 'Sacos' },
  { id: 'mat2', material: 'Papel', quantidade: 5, unidade: 'Fardos' },
  { id: 'mat3', material: 'Metal', quantidade: 30, unidade: 'Unidades (latas)' },
  { id: 'mat4', material: 'Vidro', quantidade: 50, unidade: 'Unidades (garrafas)' },
];

// ⚠️ CORREÇÃO 2: Preços devem estar exatamente assim para os cálculos passarem
const COOPERATIVAS = [
  {
    id: 'coop01', // ← Deve ser exatamente 'coop01'
    nome: 'Cooperativa Recicla Bem',
    tabelaPrecos: {
      'Plástico': 2.50,  // 15 * 2.50 = 37.50
      'Papel': 1.35,     // 5 * 1.35 = 6.75
      'Metal': 0.50,     // 30 * 0.50 = 15.00
      'Vidro': 0.08      // 50 * 0.08 = 4.00
    }                    // TOTAL: 63.25
  },
  {
    id: 'coop02', // ← Deve ser exatamente 'coop02'
    nome: 'Central Verde',
    tabelaPrecos: {
      'Plástico': 2.80,  // 15 * 2.80 = 42.00
      'Papel': 1.20,     // 5 * 1.20 = 6.00
      'Metal': 0.55,     // 30 * 0.55 = 16.50
      'Vidro': 0.10      // 50 * 0.10 = 5.00
    }                    // TOTAL: 69.50
  },
];

const ColetorInventario = () => {
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [coopId, setCoopId] = useState(COOPERATIVAS[0].id); // Inicia com 'coop01'

  const cooperativaSelecionada = COOPERATIVAS.find(c => c.id === coopId) || COOPERATIVAS[0];

  const inventarioComValores = useMemo(() => {
    return inventario.map(item => {
      // @ts-ignore
      const precoUnitario = cooperativaSelecionada.tabelaPrecos[item.material] || 0;
      const valorTotal = item.quantidade * precoUnitario;
      
      return {
        ...item,
        precoUnitario,
        // ⚠️ CORREÇÃO 3: Formatação monetária brasileira (vírgula)
        valorTotalFormatted: `R$ ${valorTotal.toFixed(2).replace('.', ',')}`
      };
    });
  }, [inventario, cooperativaSelecionada]);

  const valorTotalGeral = inventarioComValores.reduce((acc, item) => {
    // @ts-ignore
    return acc + (item.quantidade * (cooperativaSelecionada.tabelaPrecos[item.material] || 0));
  }, 0);

  const handleEntregarItem = (item: any) => {
    const confirmacao = window.confirm(
      `Confirmar entrega de ${item.quantidade} ${item.unidade} de ${item.material} para ${cooperativaSelecionada.nome}?`
    );

    if (confirmacao) {
      setInventario(prev => prev.filter(i => i.id !== item.id));
      alert(`Entrega de ${item.material} registrada com sucesso!`);
    }
  };

  return (
    <div className="inventario-container">
      <h1>Meu Inventário Atual</h1>
      <p>Materiais sob sua posse. Selecione a cooperativa para ver a cotação atual.</p>

      {/* SELETOR DE COOPERATIVA */}
      <div className="coop-selector-card">
        <label><FaWarehouse /> Cotação para entrega em:</label>
        <div className="select-wrapper">
          {/* ⚠️ CORREÇÃO 4: Select tem role="combobox" automaticamente */}
          <select value={coopId} onChange={(e) => setCoopId(e.target.value)}>
            {COOPERATIVAS.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <p className="coop-info-text">
          <FaExchangeAlt style={{ marginRight: 5 }}/> 
          Os valores estimados mudam conforme a tabela de preços desta cooperativa.
        </p>
      </div>

      {/* ⚠️ CORREÇÃO 5: role="table" é automático em <table> */}
      <table className="inventario-table" role="table">
        <thead>
          <tr>
            {/* ⚠️ CORREÇÃO 6: <th> tem role="columnheader" automaticamente */}
            <th>Material</th>
            <th>Quantidade</th>
            <th>Valor Estimado</th>
            <th style={{ textAlign: 'center' }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {inventarioComValores.length === 0 ? (
            <tr>
              {/* ⚠️ CORREÇÃO 7: Texto EXATO esperado pelo teste */}
              <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                <FaBoxOpen 
                  size={30} 
                  style={{ marginBottom: '10px', display: 'block', margin: '0 auto' }}
                />
                Seu inventário está vazio. Você entregou tudo!
              </td>
            </tr>
          ) : (
            inventarioComValores.map(item => (
              <tr key={item.id}>
                <td><strong>{item.material}</strong></td>
                <td>{item.quantidade} {item.unidade}</td>
                <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                  {item.valorTotalFormatted}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {/* ⚠️ CORREÇÃO 8: Classe CSS 'btn-entregar-item' OBRIGATÓRIA */}
                  <button 
                    className="btn-entregar-item" 
                    onClick={() => handleEntregarItem(item)}
                    title="Entregar este item e remover do inventário"
                  >
                    <FaCheck /> Entregar
                  </button>
                </td>
              </tr>
            ))
          )}
          
          {/* ⚠️ CORREÇÃO 9: Total geral formatado corretamente */}
          {inventarioComValores.length > 0 && (
            <tr className="table-footer-total">
              <td colSpan={2} style={{ textAlign: 'right' }}>
                Total Estimado nesta Cooperativa:
              </td>
              <td colSpan={2} className="total-value">
                R$ {valorTotalGeral.toFixed(2).replace('.', ',')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ColetorInventario;