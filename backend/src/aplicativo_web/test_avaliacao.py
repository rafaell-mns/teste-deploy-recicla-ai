# backend/src/aplicativo_web/test_avaliacao.py

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Produtor, Coletor, SolicitacaoColeta
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal

class AvaliacaoProdutorTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Cria o cenário: Um Produtor e um Coletor
        self.produtor = Produtor.objects.create(
            nome="Produtor Avaliado",
            email="produtor@teste.com",
            senha="123",
            cpf_cnpj="12345678900",
            nota_avaliacao_atual=0.0,
            total_avaliacoes=0
        )

        self.coletor = Coletor.objects.create(
            nome="Coletor Avaliador",
            email="coletor@teste.com",
            senha="123",
            cpf="09876543210"
        )

        # 2. Cria uma Coleta já CONCLUIDA (ou CONFIRMADA) entre eles
        self.coleta = SolicitacaoColeta.objects.create(
            produtor=self.produtor,
            coletor=self.coletor,
            status="CONCLUIDA", # Status que permite avaliação
            inicio_coleta=timezone.now(),
            fim_coleta=timezone.now()
        )
        
        # 3. Gera o Token do Coletor (simulando o login)
        refresh = RefreshToken()
        refresh['user_id'] = self.coletor.pk
        refresh['user_type'] = 'coletor'
        self.token_coletor = str(refresh.access_token)

    def test_avaliar_produtor_sucesso(self):
        """
        Teste: O coletor envia nota 5 e comentário.
        Esperado: Status 200 e nota do produtor atualizada para 5.0.
        """
        url = '/api/avaliar/produtor/'
        
        payload = {
            "coleta_id": self.coleta.id,
            "nota": 5.0,
            "comentario": "Excelente material!"
        }

        # Autentica como coletor
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_coletor}')

        # Faz a requisição
        response = self.client.post(url, payload, format='json')

        # Verifica se deu certo
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Recarrega o produtor do banco para conferir a nota
        self.produtor.refresh_from_db()
        self.assertEqual(self.produtor.total_avaliacoes, 1)
        self.assertEqual(self.produtor.nota_avaliacao_atual, Decimal('5.00'))

    def test_avaliar_produtor_calculo_media(self):
        """
        Teste: Produtor já tem nota. Nova avaliação deve recalcular a média.
        """
        # Cenário inicial: 1 avaliação nota 5.0
        self.produtor.total_avaliacoes = 1
        self.produtor.nota_avaliacao_atual = 5.0
        self.produtor.save()

        # Nova avaliação: Nota 3.0
        url = '/api/avaliar/produtor/'
        payload = {
            "coleta_id": self.coleta.id,
            "nota": 3.0
        }
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_coletor}')
        self.client.post(url, payload, format='json')

        # Esperado: (5 + 3) / 2 = 4.0
        self.produtor.refresh_from_db()
        self.assertEqual(self.produtor.total_avaliacoes, 2)
        self.assertEqual(self.produtor.nota_avaliacao_atual, Decimal('4.00'))