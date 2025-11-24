import React, { useEffect, useState } from 'react';
import api from '../apiFetch';
import './ColetorDashboard.css';
import HistoricoAvaliacoes from './HistoricoAvaliacoes';
import { FaListAlt, FaStar, FaThumbsUp } from 'react-icons/fa';

// --- MOCKS DE AVALIAÇÕES ---
const MOCK_NOTAS_RECEBIDAS = [
  { id: 1, data: '21/11/2025', autor: 'Cooperativa Verde', nota: 5, comentario: 'Entrega rápida e material bem separado.' },
  { id: 2, data: '19/11/2025', autor: 'Recicla Bem', nota: 3, comentario: 'Material chegou misturado.' },
];

const MOCK_NOTAS_DADAS = [
  { id: 1, data: '21/11/2025', autor: 'Você (para Mercado do João)', nota: 5, comentario: 'Produtor nota 10.' },
  { id: 2, data: '20/11/2025', autor: 'Você (para Condomínio Solar)', nota: 2, comentario: 'Demorou muito na portaria.' },
];

const ColetorHistorico: React.FC = () => {
    // Estado para controlar qual aba estamos vendo
    const [abaAtiva, setAbaAtiva] = useState<'entregas' | 'recebidas' | 'dadas'>('entregas');
    
    // Estado das entregas reais (mantido do seu código original)
    const [minhasAceitas, setMinhasAceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Busca dados reais de entregas
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await api.request('/api/coletas/minhas_coletor/');
                if (!mounted) return;
                if (!resp.ok) {
                    // Se der erro (ex: 404 no mock), apenas não mostra nada ou usa array vazio
                    console.warn("API de histórico indisponível, usando lista vazia.");
                    setMinhasAceitas([]); 
                    setLoading(false);
                    return;
                }
                const data = await resp.json();
                const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
                setMinhasAceitas(list);
            } catch (err: any) {
                console.warn("Erro ao buscar histórico:", err);
                setMinhasAceitas([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const formatDateTime = (value: any, hoursToSubtract = 0) => {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        if (hoursToSubtract) d.setHours(d.getHours() - hoursToSubtract);
        return `${d.toLocaleDateString('pt-BR')} ${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <div className="historico-entregas-list" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>Meu Histórico e Reputação</h2>

            {/* MENU DE ABAS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setAbaAtiva('entregas')}
                    className={`tab-button ${abaAtiva === 'entregas' ? 'active' : ''}`}
                    style={{ 
                        padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: abaAtiva === 'entregas' ? '#28a745' : '#e9ecef', color: abaAtiva === 'entregas' ? '#fff' : '#555',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <FaListAlt /> Entregas Realizadas
                </button>
                <button 
                    onClick={() => setAbaAtiva('recebidas')}
                    className={`tab-button ${abaAtiva === 'recebidas' ? 'active' : ''}`}
                    style={{ 
                        padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: abaAtiva === 'recebidas' ? '#ffc107' : '#e9ecef', color: abaAtiva === 'recebidas' ? '#fff' : '#555',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <FaStar /> Avaliações Recebidas
                </button>
                <button 
                    onClick={() => setAbaAtiva('dadas')}
                    className={`tab-button ${abaAtiva === 'dadas' ? 'active' : ''}`}
                    style={{ 
                        padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: abaAtiva === 'dadas' ? '#17a2b8' : '#e9ecef', color: abaAtiva === 'dadas' ? '#fff' : '#555',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <FaThumbsUp /> Minhas Avaliações
                </button>
            </div>

            {/* CONTEÚDO DA ABA: ENTREGAS */}
            {abaAtiva === 'entregas' && (
                <section>
                    {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Carregando histórico...</div>}
                    {!loading && minhasAceitas.length === 0 && (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '10px' }}>
                            <p>Você ainda não possui histórico de entregas registrado.</p>
                        </div>
                    )}
                    {!loading && minhasAceitas.map((c) => (
                        <div key={c.id} className="entrega-card">
                            <h3>
                                Solicitação #{c.id} 
                                <span className={`status-badge status-${String(c.status || '').toLowerCase()}`}>
                                    {c.status_display || c.status}
                                </span>
                            </h3>
                            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                                <div>
                                    <p style={{ margin: '5px 0' }}><strong>Produtor:</strong> {c.produtor?.nome || '—'}</p>
                                    <p style={{ margin: '5px 0' }}><strong>Data:</strong> {formatDateTime(c.inicio_coleta, 6)}</p>
                                </div>
                                <div>
                                    <strong>Itens Coletados:</strong>
                                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                        {Array.isArray(c.itens) ? c.itens.map((it: any, idx: number) => (
                                            <li key={idx}>
                                                {it.tipo_residuo || it.categoria} 
                                                {it.quantidade ? ` (${it.quantidade} ${it.unidade_medida || ''})` : ''}
                                            </li>
                                        )) : <li>{c.itens_count || 0} itens variados</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* CONTEÚDO DA ABA: AVALIAÇÕES RECEBIDAS */}
            {abaAtiva === 'recebidas' && (
                <HistoricoAvaliacoes 
                    titulo="O que as Cooperativas dizem sobre seu serviço" 
                    avaliacoes={MOCK_NOTAS_RECEBIDAS} 
                />
            )}

            {/* CONTEÚDO DA ABA: AVALIAÇÕES DADAS */}
            {abaAtiva === 'dadas' && (
                <HistoricoAvaliacoes 
                    titulo="Avaliações que você fez dos Produtores" 
                    avaliacoes={MOCK_NOTAS_DADAS} 
                />
            )}
        </div>
    );
};

export default ColetorHistorico;