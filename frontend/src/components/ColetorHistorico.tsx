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
    // abas
    const [abaAtiva, setAbaAtiva] = useState<'entregas' | 'recebidas' | 'dadas'>('entregas');

    // entregas reais
    const [minhasAceitas, setMinhasAceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // NOVO: nota geral real do coletor
    const [notaMedia, setNotaMedia] = useState<number | null>(null);
    const [totalAvaliacoes, setTotalAvaliacoes] = useState<number | null>(null);
    const [loadingNota, setLoadingNota] = useState<boolean>(false);

    // Busca histórico de entregas do coletor
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await api.request('/api/coletas/minhas_coletor/');
                if (!mounted) return;
                if (!resp.ok) {

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

    // NOVO: busca perfil do coletor para pegar nota_media e total_avaliacoes
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingNota(true);
                // Ajuste a URL se o backend usar outro caminho (ex.: /api/coletor/perfil/)
                const resp = await api.request('/api/coletor/perfil/');
                if (!mounted) return;

                if (!resp.ok) {
                    console.warn("Não foi possível obter o perfil do coletor.");
                    setNotaMedia(null);
                    setTotalAvaliacoes(null);
                    return;
                }

                const data = await resp.json();
                const nota = typeof data.nota_avaliacao_atual === 'number'
                    ? data.nota_avaliacao_atual
                    : (data.nota_avaliacao_atual ? Number(data.nota_avaliacao_atual) : null);

                const total = typeof data.total_avaliacoes === 'number'
                    ? data.total_avaliacoes
                    : (data.total_avaliacoes ? Number(data.total_avaliacoes) : null);

                setNotaMedia(!isNaN(Number(nota)) ? Number(nota) : null);
                setTotalAvaliacoes(!isNaN(Number(total)) ? Number(total) : null);
            } catch (err) {
                console.warn("Erro ao buscar nota média do coletor:", err);
                setNotaMedia(null);
                setTotalAvaliacoes(null);
            } finally {
                if (mounted) setLoadingNota(false);
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

            {/* ABA: ENTREGAS */}
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

            {/* ABA: AVALIAÇÕES RECEBIDAS */}
            {abaAtiva === 'recebidas' && (
                <section>
                    {/* BLOCO DA NOTA GERAL REAL */}
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '15px 20px',
                            borderRadius: '10px',
                            background: '#fff3cd',
                            border: '1px solid #ffeeba',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaStar style={{ color: '#ffc107', fontSize: '24px' }} />
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#856404' }}>Sua nota média junto às cooperativas</div>
                                {loadingNota ? (
                                    <div style={{ color: '#856404' }}>Carregando nota...</div>
                                ) : notaMedia != null && totalAvaliacoes != null && totalAvaliacoes > 0 ? (
                                    <div style={{ color: '#856404' }}>
                                        Nota média: <strong>{notaMedia.toFixed(1)}</strong> ({totalAvaliacoes} avaliação{totalAvaliacoes > 1 ? 'es' : ''})
                                    </div>
                                ) : (
                                    <div style={{ color: '#856404' }}>
                                        Você ainda não recebeu avaliações de cooperativas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LISTA MOCKADA EMBAIXO */}
                    <HistoricoAvaliacoes 
                        titulo="O que as Cooperativas dizem sobre seu serviço" 
                        avaliacoes={MOCK_NOTAS_RECEBIDAS} 
                    />
                </section>
            )}

            {/* ABA: AVALIAÇÕES DADAS */}
            {abaAtiva === 'dadas' && (
                <HistoricoAvaliacoes 
                    titulo="Avaliações que você fez dos Produtores" 
                    avaliacoes={MOCK_NOTAS_DADAS} 
                />
            )}
        </div>
    );
};
