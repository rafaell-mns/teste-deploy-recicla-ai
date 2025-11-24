import React, { useState } from 'react';
import './ColetorDashboard.css'; // Importa os novos estilos

// --- Estrutura de Dados do Histórico de Entregas ---
interface Entrega {
    id: string;
    dataEntrega: string;
    cooperativa: string;
    pesoTotalKg: number;
    detalhes: {
        material: string;
        pesoKg: number;
    }[];
}

// --- Dados Setados para o Histórico (Mock Data) ---
const mockHistoricoEntregas: Entrega[] = [
    {
        id: 'E001',
        dataEntrega: '2025-10-25',
        cooperativa: 'Reciclagem Teresina Sul',
        pesoTotalKg: 35.8,
        detalhes: [
            { material: 'Plástico PET', pesoKg: 15.2 },
            { material: 'Papelão', pesoKg: 20.6 },
        ],
    },
    {
        id: 'E002',
        dataEntrega: '2025-10-18',
        cooperativa: 'Cooperativa Verde Piauí',
        pesoTotalKg: 51.0,
        detalhes: [
            { material: 'Vidro', pesoKg: 45.0 },
            { material: 'Metal (Alumínio)', pesoKg: 6.0 },
        ],
    },
    {
        id: 'E003',
        dataEntrega: '2025-10-10',
        cooperativa: 'Reciclagem Teresina Sul',
        pesoTotalKg: 22.5,
        detalhes: [
            { material: 'Plástico PET', pesoKg: 10.0 },
            { material: 'Papel Misto', pesoKg: 12.5 },
        ],
    },
];

// --- Componente: Histórico de Entregas ---
const HistoricoEntregas: React.FC = () => {
    return (
        <div className="historico-entregas-list">
            <h2>Histórico de Entregas à Cooperativa</h2>
            {mockHistoricoEntregas.map((entrega) => (
                <div key={entrega.id} className="entrega-card">
                    <h3>
                        Entrega #{entrega.id}
                        <span>{new Date(entrega.dataEntrega).toLocaleDateString('pt-BR')}</span>
                    </h3>
                    <p>
                        <strong>Cooperativa:</strong> {entrega.cooperativa}
                    </p>
                    <p>
                        <strong>Peso Total:</strong> {entrega.pesoTotalKg.toFixed(2)} Kg
                    </p>
                    <div style={{ marginTop: '10px' }}>
                        <strong>Detalhes dos Materiais:</strong>
                        <ul>
                            {entrega.detalhes.map((det, index) => (
                                <li key={index}>
                                    {det.material}: {det.pesoKg.toFixed(2)} Kg
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
            {mockHistoricoEntregas.length === 0 && (
                <p>Nenhuma entrega registrada ainda.</p>
            )}
        </div>
    );
};

// --- Componente Principal: ColetorDashboard com Abas ---
const ColetorDashboard: React.FC = () => {
    // Estado para controlar qual aba está ativa. Começamos com 'disponiveis'.
    const [activeTab, setActiveTab] = useState<'disponiveis' | 'inventario' | 'minhasColetas'>('minhasColetas');

    // Funções para renderizar o conteúdo de cada aba
    const renderContent = () => {
        switch (activeTab) {
            case 'disponiveis':
                return (
                    <div>
                        <h2>Coletas Disponíveis (Mapa)</h2>
                        <p>Simulação do mapa com pontos de coleta. (Conteúdo já existia)</p>
                        <div style={{ height: '300px', backgroundColor: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                            [Imagem de Mapa de Coletas Placeholder]
                        </div>
                    </div>
                );
            case 'inventario':
                return (
                    <div>
                        <h2>Inventário Atual</h2>
                        <p>
                            Aqui você verá os itens que você coletou e que ainda estão sob sua posse, aguardando a entrega na Cooperativa.
                        </p>
                        <ul>
                            <li>Plástico (35 kg)</li>
                            <li>Vidro (10 kg)</li>
                            <li>Metal (5 kg)</li>
                        </ul>
                    </div>
                );
            case 'minhasColetas':
                return <HistoricoEntregas />;
            default:
                return null;
        }
    };

    return (
        <div className="coletor-dashboard-container">
            <h1>Painel do Coletor</h1>
            
            <div className="tabs-container">
                <div className="tab-buttons">
                    <button
                        className={`tab-button ${activeTab === 'disponiveis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('disponiveis')}
                    >
                        Coletas Disponíveis
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'inventario' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventario')}
                    >
                        Inventário
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'minhasColetas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('minhasColetas')}
                    >
                        Minhas Coletas
                    </button>
                </div>
                
                <div className="tab-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ColetorDashboard;