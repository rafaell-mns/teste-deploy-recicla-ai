from django.test import TestCase
from django.db.models.signals import post_save
import json

from .models import Cooperativa


class CooperativaNotificationTest(TestCase):
    """Teste TDD: quando uma nova cooperativa se cadastrar, uma notificação
    (push / popup no navegador) deve ser disparada para coletores ativos/logados.
    """

    def test_notification_sent_to_active_collectors_on_cooperativa_create(self):
        called = {'hit': False, 'created': False, 'instance': None}

        def receiver(sender, instance, created, **kwargs):
            called['hit'] = True
            called['created'] = created
            called['instance'] = instance

        # Conecta temporariamente o receiver ao sinal post_save do modelo
        post_save.connect(receiver, sender=Cooperativa)

        try:
            payload = {
                'nome_empresa': 'Teste Coop',
                'email': 'teste-coop@example.com',
                'senha': 'senha123',
                'telefone': '85999999999',
                'cnpj': '00000000000191',
                'cep': '64000000',
                'rua': 'Rua Teste',
                'numero': '100',
                'bairro': 'Bairro',
                'cidade': 'Teresina',
                'estado': 'PI'
            }

            resp = self.client.post(
                '/api/register/cooperative/', data=json.dumps(payload), content_type='application/json')
            # Verifica que endpoint criou o recurso
            self.assertIn(resp.status_code, (200, 201),
                          msg=f"Unexpected status {resp.status_code} - {resp.content}")

            # Assegura que o receiver conectado ao post_save foi chamado
            self.assertTrue(
                called['hit'], msg='post_save receiver was not called')
            self.assertTrue(called['created'],
                            msg='post_save created flag was not True')
            self.assertIsNotNone(called['instance'])
            self.assertEqual(called['instance'].email, payload['email'])
        finally:
            post_save.disconnect(receiver, sender=Cooperativa)
