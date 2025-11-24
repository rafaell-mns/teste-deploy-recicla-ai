Guia Rápido de Teste e Visualização - Frontend ReciclaAI

No src/App.tsx

Toda a lógica para alternar entre as telas está centralizada em um único arquivo e em uma única linha de código.

Abra o projeto no VS Code.

Navegue até o arquivo src/App.tsx.

Encontre a seguinte linha de código (geralmente próxima à linha 23):

const [loggedInUser, setLoggedInUser] = useState<User | null>(/* AQUI VAI O CÓDIGO DE SIMULAÇÃO */);


Para visualizar cada tela, basta alterar o valor que está dentro do useState() conforme os exemplos abaixo. Lembre-se de salvar o arquivo (Ctrl + S) após cada alteração para que o navegador recarregue com a nova visualização.

Como Visualizar Cada Tela

1. Tela de Login / Cadastro

Para ver a tela inicial onde o usuário entra ou se cadastra.

O que fazer: Altere o valor do useState para null.

Código:

useState<User | null>(null);


Como Acessar: Abra http://localhost:3000 no navegador. Você será automaticamente direcionado para a página de login.

2. Telas do Produtor

Para ver o dashboard do Produtor de resíduos.

O que fazer: Altere o valor do useState para um objeto de usuário do tipo produtor.

Código:

useState<User | null>({ name: 'Nome', type: 'produtor' });


Como Acessar:

Página Principal (Solicitar Coleta): Acesse http://localhost:3000.

3. Tela do Coletor

Para ver o dashboard do Coletor, com a lista de coletas disponíveis.

O que fazer: Altere o valor do useState para um objeto de usuário do tipo coletor.

Código:

useState<User | null>({ name: 'Nome', type: 'coletor' });


Como Acessar:

Página Principal (Coletas Disponíveis): Acesse http://localhost:3000.

4. Tela da Cooperativa (Placeholder)

Para ver a tela de boas-vindas da Cooperativa (atualmente um placeholder).

O que fazer: Altere o valor do useState para um objeto de usuário do tipo cooperativa.

Código:

useState<User | null>({ name: 'Recicla Teresina', type: 'cooperativa' });


Como Acessar:

Página Principal (Dashboard): Acesse http://localhost:3000.

