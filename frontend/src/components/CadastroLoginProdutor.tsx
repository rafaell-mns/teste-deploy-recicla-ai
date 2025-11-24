import React, { useState } from 'react';
import './CadastroLoginProdutor.css'; // Vamos criar este arquivo de estilo a seguir

const CadastroLoginProdutor = () => {
  // Estado para controlar se estamos na tela de Login (true) ou Cadastro (false)
  const [isLogin, setIsLogin] = useState<boolean>(true);

  // Tipo de usuário no cadastro: 'producer' | 'collector' | 'cooperative'
  const [role, setRole] = useState<'producer' | 'collector' | 'cooperative'>('producer');

  // Estados para controlar os valores dos campos do formulário
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [nome, setNome] = useState<string>('');       // Apenas para cadastro
  const [endereco, setEndereco] = useState<string>(''); // Apenas para cadastro

  // Estado para feedback ao usuário
  const [feedback, setFeedback] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, any> | null>(null);

  // Campos adicionais de cadastro
  const [telefone, setTelefone] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [cep, setCep] = useState<string>('');
  const [rua, setRua] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [bairro, setBairro] = useState<string>('');
  const [cidade, setCidade] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [nomeEmpresa, setNomeEmpresa] = useState<string>('');

  // Função para alternar entre os formulários de login e cadastro
  const toggleForm = (event: React.MouseEvent) => {
    event.preventDefault(); // Impede que o link recarregue a página
    setIsLogin(!isLogin);
    setFeedback(''); // Limpa o feedback ao trocar de formulário
  };

  // Função chamada ao submeter o formulário
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Impede que a página recarregue ao submeter
    setFeedback('Processando...');
    setErrors(null);

    if (isLogin) {
      // mantenha a lógica local de login por enquanto
      console.log('Tentativa de Login com:', { email, senha });
      setFeedback('Login realizado com sucesso! (Simulação)');
      return;
    }

    // Monta payload conforme role
    let endpoint = '/api/register/producer/';
    const body: Record<string, any> = {};

    if (role === 'producer') {
      endpoint = '/api/register/producer/';
      body.nome = nome || '';
      body.email = email;
      body.senha = senha;
      body.telefone = telefone;
      body.cpf = cpf;
      body.cep = cep;
      body.rua = rua;
      body.numero = numero;
      body.bairro = bairro;
      body.cidade = cidade;
      body.estado = estado;
    } else if (role === 'collector') {
      endpoint = '/api/register/collector/';
      body.nome = nome || '';
      body.email = email;
      body.senha = senha;
      body.telefone = telefone;
      body.cpf = cpf;
      body.cep = cep;
      body.cidade = cidade;
      body.estado = estado;
    } else if (role === 'cooperative') {
      endpoint = '/api/register/cooperative/';
      body.nome_empresa = nomeEmpresa || '';
      body.email = email;
      body.senha = senha;
      body.telefone = telefone;
      body.cnpj = cnpj;
      body.cep = cep;
      body.rua = rua;
      body.numero = numero;
      body.bairro = bairro;
      body.cidade = cidade;
      body.estado = estado;
    }

    // Faz request
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 201 || res.status === 200) {
          setFeedback('Cadastro realizado com sucesso!');
          setErrors(null);
          // Volta para login após sucesso
          setIsLogin(true);
          // limpa campos importantes
          setNome('');
          setNomeEmpresa('');
          setEmail('');
          setSenha('');
          setTelefone('');
          setCpf('');
          setCep('');
          setRua('');
          setNumero('');
          setBairro('');
          setCidade('');
          setEstado('');
          setCnpj('');
        } else if (res.status === 400) {
          setFeedback('Erros no formulário. Veja abaixo.');
          setErrors(data || { detail: 'Bad request' });
        } else {
          setFeedback('Erro desconhecido: ' + res.status);
          setErrors(data || null);
        }
      })
      .catch((err) => {
        console.error('Erro na requisição:', err);
        setFeedback('Falha ao conectar ao servidor.');
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Login' : 'Cadastro'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Seleção de tipo (aparece somente no cadastro) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role">Tipo de Conta</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="producer">Produtor</option>
                <option value="collector">Coletor</option>
                <option value="cooperative">Cooperativa</option>
              </select>
            </div>
          )}
          {/* Campos que aparecem apenas no formulário de cadastro */}
          {!isLogin && (
            <>
              {/* Para produtor e coletor */}
              {(role === 'producer' || role === 'collector') && (
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo</label>
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Campos específicos do produtor */}
              {role === 'producer' && (
                <>
                  <div className="form-group">
                    <label htmlFor="endereco">Endereço para Coleta (Rua)</label>
                    <input
                      type="text"
                      id="rua"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="numero">Número</label>
                    <input
                      type="text"
                      id="numero"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bairro">Bairro</label>
                    <input
                      type="text"
                      id="bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Para cooperativa */}
              {role === 'cooperative' && (
                <>
                  <div className="form-group">
                    <label htmlFor="nomeEmpresa">Nome da Empresa</label>
                    <input
                      type="text"
                      id="nomeEmpresa"
                      value={nomeEmpresa}
                      onChange={(e) => setNomeEmpresa(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cnpj">CNPJ</label>
                    <input
                      type="text"
                      id="cnpj"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Campos comuns de contato/endereço */}
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="text"
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF (somente Produtor/Coletor)</label>
                <input
                  type="text"
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cep">CEP</label>
                <input
                  type="text"
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cidade">Cidade</label>
                <input
                  type="text"
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado">Estado</label>
                <input
                  type="text"
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Campos que aparecem em ambos os formulários */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>

          {feedback && <p className="feedback-message">{feedback}</p>}

          {errors && (
            <div className="error-box">
              <strong>Erros:</strong>
              <ul>
                {Object.entries(errors).map(([field, msgs]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {Array.isArray(msgs) ? msgs.join(' | ') : String(msgs)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <p className="toggle-link">
          {isLogin ? 'Ainda não tem uma conta? ' : 'Já tem uma conta? '}
          <button type="button" className="link-button" onClick={toggleForm}>
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default CadastroLoginProdutor;