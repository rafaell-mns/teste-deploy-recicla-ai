import React, { useState, useEffect } from 'react';
import './Interesses.css'; // Novo CSS para esta tela
import { FaTrash, FaPlus } from 'react-icons/fa';
import apiFetch from '../apiFetch';

// Lista completa de categorias possíveis
const TODAS_CATEGORIAS = ['Plástico', 'Papel', 'Vidro', 'Metal'];

interface Interesse {
  categoria: string;
  preco: string; // Ex: "R$ 2,50/kg" ou "Sob consulta"
}

const GerenciarInteresses = () => {
  // Estado para guardar os interesses atuais (começa com dados de exemplo)
  // início sem mock: será carregado pela API
  const [interesses, setInteresses] = useState<Interesse[]>([]);

  // Estados para o formulário de adicionar novo interesse
  const [novaCategoria, setNovaCategoria] = useState(TODAS_CATEGORIAS[0]);
  const [novoPreco, setNovoPreco] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Converte entradas (ex: "R$ 4,00/kg", "4", "4.00", "4,00") para number (ou null)
  const parsePrecoToNumber = (p: any): number | null => {
    if (p === null || p === undefined || p === '') return null;
    let s = String(p);
    s = s.replace(/R\$|r\$/g, '');
    s = s.replace(/\s|\/kg|kg/gi, '');

    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;

    if (hasDot && hasComma) {
      // Ex: "1.234,56" -> remove pontos (milhares) e transformar vírgula em ponto
      s = s.replace(/\./g, '').replace(/,/, '.');
    } else if (hasComma) {
      // Ex: "4,00" -> transformar vírgula em ponto
      s = s.replace(/\./g, '').replace(/,/, '.');
    }
    // Caso só tenha ponto, assumimos que já é decimal (ex: "4.00") -> não remover pontos

    const m = s.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };

  // Formata preço para exibição: se for número ou string numérica -> "R$ X,YY/kg", senão retorna original
  const formatPreco = (p: any) => {
    if (p === null || p === undefined || p === '') return '';
    if (typeof p === 'number') return `R$ ${p.toFixed(2).replace('.', ',')}/kg`;
    const parsed = parsePrecoToNumber(p);
    if (parsed !== null) return `R$ ${parsed.toFixed(2).replace('.', ',')}/kg`;
    return String(p);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiFetch.request('/api/cooperativa/interesses/', 'GET')
      .then(async resp => {
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`${resp.status} ${txt}`);
        }
        return resp.json();
      })
      .then((data: any) => {
        if (!mounted) return;
        const itens = (data && (data.interesses || data)) || [];

        const list = Array.isArray(itens) ? itens.map((i: any) => {
          const tipo = i.categoria ?? i.tipo_residuo ?? i.tipoResiduo ?? '';
          const precoRaw = i.preco ?? i.preco_oferecido ?? i.precoOferecido ?? i.preco_oferecido_raw ?? '';
          return {
            categoria: tipo,
            preco: formatPreco(precoRaw)
          };
        }) : [];

        setInteresses(list);
      })
      .catch(err => {
        console.error('Erro ao carregar interesses', err);
        if (mounted) setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const handleAddInteresse = (e: React.FormEvent) => {
    e.preventDefault();
    // Verifica se a categoria já não foi adicionada
    if (interesses.some(i => i.categoria === novaCategoria)) {
      alert(`A categoria "${novaCategoria}" já está na lista.`);
      return;
    }
    if (!novoPreco.trim()) {
      alert(`Por favor, informe o preço.`);
      return;
    }

    // Formata o preço para exibição (ex: "4" -> "R$ 4,00/kg"; "4.00" -> "R$ 4,00/kg")
    const precoFormatado = formatPreco(novoPreco);
    const novoInteresse: Interesse = { categoria: novaCategoria, preco: precoFormatado };
    setInteresses(prev => [...prev, novoInteresse]); // Adiciona à lista (já formatado)

    // Limpa o formulário
    setNovaCategoria(TODAS_CATEGORIAS[0]);
    setNovoPreco('');
  };

  const handleRemoveInteresse = (categoriaParaRemover: string) => {
    setInteresses(prev => prev.filter(i => i.categoria !== categoriaParaRemover));
  };

  const handleSaveChanges = () => {
    // Lógica para chamar a API e salvar a lista 'interesses' no backend
    // Transformar os preços em valores numéricos simples antes de enviar
    const parsePreco = (p: string) => {
      if (!p) return null;
      let s = p.toString();
      s = s.replace(/R\$|r\$/g, '');
      s = s.replace(/\s|\/kg|kg|K G/gi, '');
      s = s.replace(/\./g, ''); // remove milhares (ex: 1.000)
      s = s.replace(/,/, '.');
      const m = s.match(/[-0-9.]+/);
      return m ? m[0] : null;
    };

    const payload = {
      interesses: interesses.map(i => ({
        categoria: i.categoria,
        preco: parsePreco(i.preco) ?? i.preco
      }))
    };

    apiFetch.request('/api/cooperativa/interesses/', 'POST', payload)
      .then(async resp => {
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`${resp.status} ${txt}`);
        }
        alert('Lista de interesses salva com sucesso!');
      })
      .catch(err => {
        console.error('Erro ao salvar interesses', err);
        alert('Erro ao salvar interesses: ' + (err.message || err));
      });
  }

  return (
    <div className="interesses-container">
      <h1>Gerenciar Materiais de Interesse</h1>
      <p>Defina quais materiais sua cooperativa aceita e os preços oferecidos.</p>
      {loading && <p>Carregando interesses...</p>}
      {error && <p className="error">Erro: {error}</p>}

      {/* Formulário para Adicionar Novo Interesse */}
      <form className="add-interesse-form" onSubmit={handleAddInteresse}>
        <h3>Adicionar Novo Material</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="novaCategoria">Material</label>
            <select
              id="novaCategoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
            >
              {TODAS_CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="novoPreco">Preço Oferecido (ex: R$ 2,50/kg)</label>
            <input
              type="text"
              id="novoPreco"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
              placeholder="R$ 0,00/kg"
              required
            />
          </div>
          <button type="submit" className="add-button"><FaPlus /> Adicionar</button>
        </div>
      </form>

      {/* Lista de Interesses Atuais */}
      <div className="lista-interesses">
        <h3>Materiais Aceitos Atualmente</h3>
        {interesses.length === 0 ? (
          <p>Nenhum material de interesse cadastrado.</p>
        ) : (
          interesses.map((interesse, idx) => (
            <div key={interesse.categoria || idx} className="interesse-item">
              <span className="categoria-nome">{interesse.categoria}</span>
              <span className="categoria-preco">{interesse.preco}</span>
              <button
                className="remove-button"
                onClick={() => handleRemoveInteresse(interesse.categoria)}
              >
                <FaTrash /> Remover
              </button>
            </div>
          ))
        )}
      </div>

      {/* Botão para Salvar Alterações */}
      {interesses.length > 0 && (
        <button className="save-button cta-button" onClick={handleSaveChanges} disabled={loading}>
          {loading ? 'Carregando...' : 'Salvar Alterações'}
        </button>
      )}
    </div>
  );
};

export default GerenciarInteresses;