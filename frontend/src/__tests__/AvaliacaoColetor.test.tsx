import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

// Importa o componente (que no começo do TDD, pode nem existir ou estar vazio)
import AvaliacaoColetor from '../components/AvaliacaoColetor';

describe('Componente de Avaliação do Coletor', () => {
  
  test('Deve permitir selecionar 5 estrelas e chamar a função de enviar', () => {
    // 1. PREPARAÇÃO (Mock da função de callback)
    const handleAvaliarMock = jest.fn(); 

    // Renderizamos o componente
    render(
      <AvaliacaoColetor 
        nomeColetor="João Coletor" 
        onAvaliar={handleAvaliarMock} 
        onFechar={() => {}} 
      />
    );

    // 2. VERIFICAÇÃO INICIAL
    // Verifica se o texto aparece na tela
    expect(screen.getByText('Avaliar João Coletor')).toBeInTheDocument();

    // 3. AÇÃO (Simula o usuário clicando)
    // Procura o botão da 5ª estrela
    const estrela5 = screen.getByLabelText('5 estrelas');
    fireEvent.click(estrela5);

    // Clica no botão de enviar
    const botaoEnviar = screen.getByText('Enviar Avaliação');
    fireEvent.click(botaoEnviar);

    // 4. ASSERÇÃO (O teste final)
    // Verifica se a função foi chamada com a nota 5
    expect(handleAvaliarMock).toHaveBeenCalledTimes(1);
    expect(handleAvaliarMock).toHaveBeenCalledWith(5);
  });
});