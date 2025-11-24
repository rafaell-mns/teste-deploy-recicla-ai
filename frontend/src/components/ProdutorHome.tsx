import React, { useState } from 'react';
import './HomeContent.css';
import { FaTrash } from 'react-icons/fa6';
import apiFetch from '../apiFetch';


// ATUALIZADO: Mapeamento de Categorias
const UNIDADES_VISUAIS: Record<string, string> = {
  'Plástico': 'Sacos (Volume)',
  'Papel': 'Sacos (Volume)',
  'Vidro': 'Unidades',
  'Metal': 'Unidades',
};
const CATEGORIAS_DISPONIVEIS = Object.keys(UNIDADES_VISUAIS);

const UNIDADE_LABEL_PARA_CODIGO: Record<string, string> = {
  'Sacos (Volume)': 'VOLUME',
  'Unidades': 'UN',
};

interface ItemDeColeta {
  id: string;
  categoria: string;
  quantidade: number;
  unidade: string;
}



const ProdutorHome = () => {
  // --- Estados do Formulário ---
  const [itemCategoria, setItemCategoria] = useState(CATEGORIAS_DISPONIVEIS[0]);
  const [itemQuantidade, setItemQuantidade] = useState(1);
  const [listaItens, setListaItens] = useState<ItemDeColeta[]>([]);
  const [inicioColeta, setInicioColeta] = useState('');
  const [fimColeta, setFimColeta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [feedback, setFeedback] = useState('');

  // --- Funções do Formulário ---
  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault();
    const unidadeVisual = UNIDADES_VISUAIS[itemCategoria];
    const novoItem: ItemDeColeta = {
      id: new Date().toISOString(),
      categoria: itemCategoria,
      quantidade: itemQuantidade,
      unidade: unidadeVisual,
    };
    setListaItens(prevLista => [...prevLista, novoItem]);
    setItemCategoria(CATEGORIAS_DISPONIVEIS[0]);
    setItemQuantidade(1);
    setFeedback('');
  };

  const handleRemoveItem = (idParaRemover: string) => {
    setListaItens(prevLista => prevLista.filter(item => item.id !== idParaRemover));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (listaItens.length === 0) {
      setFeedback('Erro: Adicione pelo menos um item à lista de coleta.');
      return;
    }
    if (!inicioColeta || !fimColeta) {
      setFeedback('Erro: Preencha os horários de início e fim da coleta.');
      return;
    }

    const itensParaAPI = listaItens.map(item => ({
      tipo_residuo: item.categoria,
      quantidade: item.quantidade,
      unidade_medida: UNIDADE_LABEL_PARA_CODIGO[item.unidade] || item.unidade,
    }));

    const solicitacaoDeColeta = {
      itens: itensParaAPI,
      observacoes: observacoes,
      inicio_coleta: inicioColeta,
      fim_coleta: fimColeta,
    };

    try {
      const resp = await apiFetch.solicitarColeta(solicitacaoDeColeta);
      if (resp.ok) {
        setFeedback(`Solicitação com ${listaItens.length} tipo(s) de item enviada com sucesso!`);
        setListaItens([]);
        setObservacoes('');
        setInicioColeta('');
        setFimColeta('');
      } else {
        const data = await resp.json().catch(() => null);
        const errMsg = data && (data.detail || data.message) ? (data.detail || data.message) : `Status ${resp.status}`;
        setFeedback(`Erro: Não foi possível enviar a solicitação. ${errMsg}`);
      }
    } catch (error: any) {
      setFeedback(`Erro: Falha ao enviar solicitação. ${error?.message || error}`);
    }
  };

  return (
    <div className="home-content">
      <h1>Solicitar Nova Coleta</h1>
      <p>Adicione os materiais que você separou, um por um, e defina a quantidade.</p>

      <form className="coleta-form" onSubmit={handleSubmit}>
        {/* Seção 1: Adicionar Itens */}
        <fieldset className="form-section">
          <legend>1. Adicionar Itens</legend>
          <div className="add-item-form">
            <div className="form-group-vertical" style={{ flexGrow: 2 }}>
              <label htmlFor="itemCategoria">Categoria do Material</label>
              <select
                id="itemCategoria"
                value={itemCategoria}
                onChange={(e) => setItemCategoria(e.target.value)}
              >
                {CATEGORIAS_DISPONIVEIS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group-vertical" style={{ flexGrow: 1 }}>
              <label htmlFor="itemQuantidade">Quantidade</label>
              <input
                type="number"
                id="itemQuantidade"
                value={itemQuantidade}
                min="1"
                onChange={(e) => {
                  const parsed = parseInt(e.target.value as string, 10);
                  setItemQuantidade(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
                }}
              />
            </div>

            <div className="form-group-vertical unit-display">
              <label>Unidade</label>
              <span>{UNIDADES_VISUAIS[itemCategoria]}</span>
            </div>

            <button type="button" onClick={handleAddItem} className="add-item-btn">Adicionar</button>
          </div>
        </fieldset>

        {/* Seção 2: Lista de Itens a Coletar */}
        <fieldset className="form-section">
          <legend>2. Itens a Coletar</legend>
          <div className="itens-list">
            {listaItens.length === 0 ? (
              <p className="lista-vazia-msg">Sua lista de coleta está vazia.</p>
            ) : (
              listaItens.map((item) => (
                <div key={item.id} className="item-adicionado">
                  <div className="item-info">
                    <span className="item-descricao">
                      {item.quantidade} {item.unidade}
                    </span>
                    <span className="item-categoria">{item.categoria}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="remove-item-btn">
                    <FaTrash /> Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </fieldset>

        {/* Seção 3: Detalhes Finais */}
        <fieldset className="form-section">
          <legend>3. Detalhes Finais</legend>
          <div className="form-row-horizontal">
            <div className="form-group-vertical">
              <label htmlFor="inicioColeta">Disponível a partir de:</label>
              <input type="datetime-local" id="inicioColeta" value={inicioColeta} onChange={(e) => setInicioColeta(e.target.value)} required />
            </div>
            <div className="form-group-vertical">
              <label htmlFor="fimColeta">Disponível até:</label>
              <input type="datetime-local" id="fimColeta" value={fimColeta} onChange={(e) => setFimColeta(e.target.value)} required />
            </div>
          </div>
          <div className="form-group-vertical" style={{ marginTop: '20px' }}>
            <label htmlFor="observacoes">Observações (opcional):</label>
            <textarea
              id="observacoes"
              placeholder="Ex: Sacos pesados, deixar na portaria, item frágil..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Seção 4: Envio */}
        <button type="submit" className="cta-button">Confirmar e Solicitar Coleta</button>

        {feedback && (
          <p className={`form-feedback ${feedback.includes('Erro') ? 'error' : 'success'}`}>
            {feedback}
          </p>
        )}
      </form>

   
        
     
    </div>
  );
};

export default ProdutorHome;