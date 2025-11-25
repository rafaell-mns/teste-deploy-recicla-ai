# backend/src/aplicativo_web/models.py

from django.db import models
from django.utils import timezone


class Coletor(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf = models.CharField(max_length=14, unique=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    nota_avaliacao_atual = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_avaliacoes = models.IntegerField(default=0)

    class Meta:
        db_table = "coletor"

    def __str__(self):
        return f"{self.nome} ({self.email})"


class Cooperativa(models.Model):
    id = models.AutoField(primary_key=True)
    nome_empresa = models.CharField(max_length=150)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cnpj = models.CharField(max_length=18, unique=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    rua = models.CharField(max_length=150, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "cooperativa"

    def __str__(self):
        return self.nome_empresa


class Produtor(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, unique=True, blank=True, null=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    rua = models.CharField(max_length=150, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    nota_avaliacao_atual = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_avaliacoes = models.IntegerField(default=0)
    saldo_pontos = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        db_table = "produtor"

    def __str__(self):
        return f"{self.nome} ({self.email})"


class SolicitacaoColeta(models.Model):
    STATUS_CHOICES = [
        ('SOLICITADA', 'Solicitada'),
        ('ACEITA', 'Aceita'),
        ('CANCELADA', 'Cancelada'),
        ('CONFIRMADA', 'Confirmada'),
        ('AGUARDANDO', 'Aguardando'),
        ('CONCLUIDA','Concluída'),
    ]
    produtor = models.ForeignKey(
        Produtor, on_delete=models.CASCADE, related_name="solicitacoes", db_column='produtor_id')
    coletor = models.ForeignKey(
        Coletor, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="coletas", db_column='coletor_id')
    cooperativa = models.ForeignKey(
        Cooperativa, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='solicitacoes', db_column='cooperativa_id')
    inicio_coleta = models.DateTimeField(default=timezone.now)
    solicitacao = models.DateTimeField(default=timezone.now)
    fim_coleta = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=55, choices=STATUS_CHOICES, default='SOLICITADA')
    observacoes = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        nome_produtor = self.produtor.nome if self.produtor else 'Produtor Desconhecido'
        return f"Solicitação #{self.id} por {nome_produtor} - Status: {self.get_status_display()}"

    class Meta:
        db_table = 'solicitacao_coleta'
        ordering = ['-id']


class ItemColeta(models.Model):
    TIPO_RESIDUO_CHOICES = [('Vidro', 'Vidro'), ('Metal', 'Metal'), ('Papel', 'Papel'), ('Plástico', 'Plástico')]
    UNIDADE_MEDIDA_CHOICES = [('KG', 'KG'), ('UN', 'UN'), ('VOLUME', 'VOLUME')]

    id_item = models.AutoField(primary_key=True)
    solicitacao = models.ForeignKey(
        SolicitacaoColeta, related_name='itens', db_column='id_solicitacao', on_delete=models.CASCADE)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    tipo_residuo = models.CharField(max_length=50, choices=TIPO_RESIDUO_CHOICES, default='Plástico')
    unidade_medida = models.CharField(max_length=10, choices=UNIDADE_MEDIDA_CHOICES, default='UN')

    class Meta:
        db_table = 'item_solicitacao'

    def __str__(self):
        return f"{self.tipo_residuo} ({self.quantidade} {self.unidade_medida}) - Solicitação #{self.solicitacao.id}"


class Recompensa(models.Model):
    STATUS_CHOICES = [('ATIVO', 'Ativo'), ('RESGATADO', 'Resgatado')]
    id_recompensa = models.AutoField(primary_key=True)
    id_produtor = models.ForeignKey(Produtor, on_delete=models.CASCADE, db_column='id_produtor')
    codigo_voucher = models.CharField(max_length=50, unique=True)
    nome_premio = models.CharField(max_length=100)
    loja_parceira = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    class Meta:
        db_table = 'recompensa'


class CooperativaMaterial(models.Model):
    TIPO_RESIDUO_CHOICES = [('Plástico', 'Plástico'), ('Papel', 'Papel'), ('Metal', 'Metal'), ('Vidro', 'Vidro')]

    id = models.AutoField(primary_key=True)
    cooperativa = models.ForeignKey(Cooperativa, on_delete=models.CASCADE, db_column='cooperativa_id')
    tipo_residuo = models.CharField(max_length=50, choices=TIPO_RESIDUO_CHOICES)
    preco_oferecido = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'cooperativa_material'
        unique_together = (('cooperativa', 'tipo_residuo'),)

    def __str__(self):
        return f"{self.cooperativa} - {self.tipo_residuo}: {self.preco_oferecido}"
