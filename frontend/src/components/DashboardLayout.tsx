import React from 'react';
import './DashboardLayout.css'; // O CSS para o nosso novo layout
import { FaRecycle, FaSignOutAlt, FaPlusCircle, FaListAlt, FaMapMarkedAlt, FaChartBar,FaClipboardList, FaDollarSign,FaStar,FaBoxes,} from 'react-icons/fa';
import { NavLink } from 'react-router-dom'; // Importa o NavLink
// Definindo as propriedades que o layout receberá
interface DashboardLayoutProps {
  user: {
    name: string;           
    type: 'produtor' | 'coletor' | 'cooperativa';
  };
  onLogout: () => void; // A função de logout que virá do App.tsx
  children: React.ReactNode; // O conteúdo principal da página
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout, children }) => {

const renderNavLinks = () => {
  switch (user.type) {
    case 'produtor':
      return (
        <>
          {/* Usamos NavLink com a prop 'to' para definir o caminho */}
          {/* A prop 'end' no primeiro link evita que ele fique ativo sempre */}
          <NavLink to="/" end className="nav-link"><FaPlusCircle /> Solicitar Coleta</NavLink>
          <NavLink to="/minhas-solicitacoes" className="nav-link"><FaListAlt /> Minhas Solicitações</NavLink>
          <NavLink to="/minhas-avaliacoes" className="nav-link"><FaStar /> Minhas Avaliações</NavLink>
        </>
      );
case 'coletor':
            return (
                <>
                    <NavLink to="/" end className="nav-link"><FaMapMarkedAlt /> Coletas Disponíveis</NavLink>

                    {/* LINK NOVO: MINHAS COLETAS (HISTÓRICO) */}
                    <NavLink to="/historico" className="nav-link"><FaListAlt /> Minhas Coletas</NavLink>

                    <NavLink to="/inventario" className="nav-link"><FaBoxes /> Inventário</NavLink>
                    {/* Lembrete: O CSS do NavLink faz ele parecer um link ativo se a rota for a certa */}
                </>
            );
    case 'cooperativa':
            return (
              <>
                <NavLink to="/" end className="nav-link"><FaChartBar /> Dashboard</NavLink>
                <NavLink to="/confirmar-entregas" className="nav-link"><FaClipboardList /> Confirmar Entregas</NavLink>
                <NavLink to="/meus-interesses" className="nav-link"><FaDollarSign /> Gerenciar Interesses</NavLink>
                {/* <NavLink to="/gerenciar-coletores" className="nav-link"><FaUsers /> Gerenciar Coletores</NavLink> */}
              </>
            );
    default:
      return null;
  }
};

  return (
    <div className="dashboard-page-container">
      {/* --- PAINEL ESQUERDO (NAVEGAÇÃO) --- */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <FaRecycle className="logo-icon" />
          <h1>ReciclaAi</h1>
        </div>
        <div className="user-profile">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-type">{user.type.charAt(0).toUpperCase() + user.type.slice(1)}</span>
          </div>
        </div>
        <div className="nav-links">
          {renderNavLinks()}
        </div>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </nav>

      {/* --- PAINEL DIREITO (CONTEÚDO PRINCIPAL) --- */}
      <main className="main-content">
        {children} {/* Aqui é onde o conteúdo específico de cada página será renderizado */}
      </main>
    </div>
  );
};

export default DashboardLayout;