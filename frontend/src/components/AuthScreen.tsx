import React, { useState } from 'react';
import './AuthScreen.css';
import { FaEnvelope, FaLock, FaRecycle, FaUser, FaIdCard, FaMapMarkerAlt, FaCity, FaHashtag, FaBuilding, FaPhone, FaTruck, FaWarehouse, FaUsers } from 'react-icons/fa';
import api from '../apiFetch';

type UserType = 'produtor' | 'coletor' | 'cooperativa';

// NOVO: Objeto para guardar as descrições de cada tipo de usuário
const userDescriptions: Record<UserType, string> = {
  produtor: "Ideal para cidadãos e empresas que geram resíduos e precisam solicitar coletas.",
  coletor: "Para profissionais autônomos que realizam a coleta dos resíduos e os transportam.",
  cooperativa: "Destinado a cooperativas e centros de triagem que recebem e processam os materiais coletados."
};

type Props = {
  onLogin?: (user: { name: string; type: 'produtor' | 'coletor' | 'cooperativa' }) => void;
};

const AuthScreen = (props: Props) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<UserType>('produtor');

  // --- Estados para os campos do formulário (sem alterações) ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState<Record<string, any> | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  // Base URL da API: usa REACT_APP_API_URL se definido, caso contrário
  // quando em dev (CRA no localhost:3000) direciona para o backend local 127.0.0.1:8000
  const API_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) ||
    (window.location.hostname === 'localhost' && window.location.port === '3000' ? 'http://127.0.0.1:8000' : '');

  const toggleForm = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLogin(!isLogin);
  };

  // Busca endereço pelo CEP usando ViaCEP (https://viacep.com.br)
  const fetchAddressFromCep = async (rawCep: string) => {
    const clean = (rawCep || '').replace(/\D/g, '');
    if (!clean || clean.length !== 8) return;
    setCepLoading(true);
    setFeedback('Buscando endereço pelo CEP...');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json().catch(() => ({}));
      if (data && !data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
        setFeedback('Endereço preenchido automaticamente.');
        setErrors(null);
      } else {
        setFeedback('CEP não encontrado. Preencha o endereço manualmente.');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setFeedback('Falha ao buscar CEP. Verifique sua conexão.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    // ... (Nenhuma alteração na função handleSubmit)
    e.preventDefault();
    if (isLogin) {
      setFeedback('Processando login...');
      setErrors(null);
      // chama helper de login
      api.login(email, password)
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          console.log('Resposta login:', res.status, data);
          if (res.status === 200) {
            // Aceita vários formatos de token retornados pelo backend
            const token = data.access || data.token || data.access_token || data.jwt || data.auth_token || null;
            const user_type = data.user_type || 'produtor';
            if (token) {
              api.setToken(token);
            } else {
              console.warn('Resposta de login sem token esperado; resposta:', data);
            }
            setFeedback('Login realizado! Redirecionando...');
            setErrors(null);
            // tenta extrair o nome retornado pela API; se não houver, usa email como fallback
            const displayName = data.name || data.nome || data.username || email;
            // avisa App sobre login
            if (props.onLogin) props.onLogin({ name: displayName, type: user_type });
          } else if (res.status === 401) {
            setFeedback('Credenciais inválidas.');
            setErrors(data || { detail: 'Unauthorized' });
          } else {
            setFeedback('Erro no login: ' + res.status);
            setErrors(data || null);
          }
        })
        .catch((err) => {
          console.error('Erro no login:', err);
          setFeedback('Falha ao conectar ao servidor.');
        });
      return;
    } else {
      if (password !== confirmPassword) {
        alert("As senhas não coincidem!");
        return;
      }
      const commonData = { name, email, password, phone };
      let specificData = {};
      switch (userType) {
        case 'produtor':
          specificData = { userType, cpf, cep, street, number, neighborhood, city, state };
          break;
        case 'coletor':
          specificData = { userType, cpf, cep, city, state };
          break;
        case 'cooperativa':
          specificData = { userType, cnpj, cep, street, number, neighborhood, city, state };
          break;
      }
      const registrationData = { ...commonData, ...specificData };

      // Monta endpoint e payload conforme backend espera (campos em português)
      let endpoint = `${API_BASE || ''}/api/register/producer/`;
      const payload: Record<string, any> = {};
      if (userType === 'produtor') {
        endpoint = `${API_BASE || ''}/api/register/producer/`;
        payload.nome = name;
        payload.email = email;
        payload.senha = password;
        payload.telefone = phone;
        payload.cpf_cnpj = cpf;
        payload.cep = cep;
        payload.rua = street;
        payload.numero = number;
        payload.bairro = neighborhood;
        payload.cidade = city;
        payload.estado = state;
      } else if (userType === 'coletor') {
        endpoint = `${API_BASE || ''}/api/register/collector/`;
        payload.nome = name;
        payload.email = email;
        payload.senha = password;
        payload.telefone = phone;
        payload.cpf = cpf;
        payload.cep = cep;
        payload.cidade = city;
        payload.estado = state;
      } else if (userType === 'cooperativa') {
        endpoint = `${API_BASE || ''}/api/register/cooperative/`;
        payload.nome_empresa = name;
        payload.email = email;
        payload.senha = password;
        payload.telefone = phone;
        payload.cnpj = cnpj;
        payload.cep = cep;
        payload.rua = street;
        payload.numero = number;
        payload.bairro = neighborhood;
        payload.cidade = city;
        payload.estado = state;
      }

      setFeedback('Processando...');
      setErrors(null);
      console.log('Cadastro: endpoint=', endpoint, 'payload=', payload);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          console.log('Resposta cadastro:', res.status, data);
          if (res.status === 201 || res.status === 200) {
            setFeedback('Cadastro realizado com sucesso!');
            setErrors(null);
            // voltar para login
            setIsLogin(true);
            // limpar campos
            setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setPhone('');
            setCpf(''); setCep(''); setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setCnpj('');
          } else if (res.status === 400) {
            setFeedback('Erros no formulário. Veja abaixo.');
            setErrors(data || { detail: 'Bad request' });
          } else {
            setFeedback('Erro desconhecido: ' + res.status);
            setErrors(data || null);
          }
        })
        .catch((err) => {
          console.error('Erro no cadastro:', err);
          setFeedback('Falha ao conectar ao servidor.');
        });
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">

        <div className="left-panel">
          <div className="logo-section">
            <FaRecycle className="logo-icon" />
            <h1>ReciclaAi</h1>
          </div>
          <h2>{isLogin ? 'Bem-vindo de volta!' : 'Junte-se a nós!'}</h2>
          <p>{isLogin ? 'Faça o login para continuar.' : 'Crie sua conta e ajude o meio ambiente.'}</p>
        </div>

        <div className="right-panel">
          <form onSubmit={handleSubmit}>
            <h3>{isLogin ? 'Entre na sua conta' : 'Crie sua Conta'}</h3>

            {isLogin ? (
              // --- CAMPOS DE LOGIN ---
              <>
                <div className="input-group">
                  <FaEnvelope className="input-icon" /><input type="email" placeholder="E-MAIL" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <FaLock className="input-icon" /><input type="password" placeholder="SENHA" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <a href="#" className="forgot-password">Esqueceu sua senha?</a>
              </>
            ) : (
              // --- CAMPOS DE CADASTRO ---
              <>
                <div className="input-group">
                  <FaUsers className="input-icon" />
                  <select value={userType} onChange={(e) => setUserType(e.target.value as UserType)} required>
                    <option value="produtor">Produtor de Resíduos</option>
                    <option value="coletor">Coletor</option>
                    <option value="cooperativa">Cooperativa</option>
                  </select>
                </div>

                {/* NOVO: Bloco da Descrição Dinâmica */}
                <div className="user-description">
                  <p>{userDescriptions[userType]}</p>
                </div>

                {/* Campos Comuns de Cadastro (sem alterações) */}
                <div className="input-group"><FaUser className="input-icon" /><input type="text" placeholder={userType === 'cooperativa' ? 'Nome da Empresa' : 'Nome Completo'} value={name} onChange={(e) => setName(e.target.value)} required /></div>
                {/* ... (resto dos campos de cadastro sem alteração) ... */}
                <div className="input-group"><FaEnvelope className="input-icon" /><input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="input-group"><FaPhone className="input-icon" /><input type="text" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="input-group"><FaLock className="input-icon" /><input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>

                {userType === 'produtor' && <>
                  <div className="input-group"><FaIdCard className="input-icon" /><input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required /></div>
                  <div className="input-group">
                    <FaMapMarkerAlt className="input-icon" />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={cep}
                      onChange={(e) => { setCep(e.target.value); const clean = e.target.value.replace(/\D/g, ''); if (clean.length === 8) fetchAddressFromCep(clean); }}
                      onBlur={() => fetchAddressFromCep(cep)}
                      required
                    />
                    {cepLoading && <small className="cep-loading">Buscando endereço...</small>}
                  </div>
                  <div className="input-group"><FaMapMarkerAlt className="input-icon" /><input type="text" placeholder="Rua, Av..." value={street} onChange={(e) => setStreet(e.target.value)} required /></div>
                  <div className="input-group"><FaHashtag className="input-icon" /><input type="text" placeholder="Número" value={number} onChange={(e) => setNumber(e.target.value)} required /></div>
                </>}
                {userType === 'coletor' && <>
                  <div className="input-group"><FaIdCard className="input-icon" /><input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} required /></div>
                  <div className="input-group"><FaCity className="input-icon" /><input type="text" placeholder="Cidade de Atuação" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                  <div className="input-group"><FaTruck className="input-icon" /><input type="text" placeholder="Estado de Atuação" value={state} onChange={(e) => setState(e.target.value)} required /></div>
                </>}
                {userType === 'cooperativa' && <>
                  <div className="input-group"><FaBuilding className="input-icon" /><input type="text" placeholder="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required /></div>
                  <div className="input-group">
                    <FaWarehouse className="input-icon" />
                    <input
                      type="text"
                      placeholder="CEP da Sede"
                      value={cep}
                      onChange={(e) => { setCep(e.target.value); const clean = e.target.value.replace(/\D/g, ''); if (clean.length === 8) fetchAddressFromCep(clean); }}
                      onBlur={() => fetchAddressFromCep(cep)}
                      required
                    />
                    {cepLoading && <small className="cep-loading">Buscando endereço...</small>}
                  </div>
                  <div className="input-group"><FaMapMarkerAlt className="input-icon" /><input type="text" placeholder="Rua/avenida" value={street} onChange={(e) => setStreet(e.target.value)} required /></div>
                </>}
              </>
            )}

            <button type="submit" className="login-btn">{isLogin ? 'Entrar' : 'Criar Conta'}</button>

            {feedback && <p className="feedback-message">{feedback}</p>}

            {errors && (
              <div className="error-box">
                <strong>Erros:</strong>
                <ul>
                  {Object.entries(errors).map(([field, msgs]) => (
                    <li key={field}><strong>{field}:</strong> {Array.isArray(msgs) ? msgs.join(' | ') : String(msgs)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="register-link">
              {isLogin ? 'Não tem conta? ' : 'Já tem uma conta? '}
              <a href="#" onClick={toggleForm}>{isLogin ? 'Se cadastre!' : 'Faça Login'}</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;