# backend/src/aplicativo_web/serializers.py
from rest_framework import serializers
import re
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta, ItemColeta
from .models import CooperativaMaterial
from django.contrib.gis.geos import Point
import requests


def geocode_address(rua, numero, bairro, cidade, estado, cep):
    endereco = f"{rua} {numero}, {bairro}, {cidade}, {estado}, {cep}, Brasil"

    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": endereco, "format": "json", "limit": 1}

    r = requests.get(url, params=params, headers={"User-Agent": "ReciclaAi"})

    if r.status_code != 200 or len(r.json()) == 0:
        return None

    dados = r.json()[0]

    lat = float(dados["lat"])
    lon = float(dados["lon"])

    return Point(lon, lat, srid=4326)

# --- Serializers de Registro (Atualizados para novos campos) ---


def create(self, validated_data):
    try:
        # Extrai endereço
        rua = validated_data.get("rua")
        numero = validated_data.get("numero")
        bairro = validated_data.get("bairro")
        cidade = validated_data.get("cidade")
        estado = validated_data.get("estado")
        cep = validated_data.get("cep")

        # Tenta geocodificar
        ponto = geocode_address(rua, numero, bairro, cidade, estado, cep)
        if ponto:
            validated_data["geom"] = ponto

        return super().create(validated_data)

    except Exception as e:
        raise serializers.ValidationError({'detail': str(e)})


class ProdutorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produtor
        # ATUALIZADO: 'cpf_cnpj' e novos campos
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf_cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'geom',
            'nota_avaliacao_atual', 'total_avaliacoes', 'saldo_pontos'
        ]
        # ATUALIZADO: 'id' e campos novos são read_only
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True},
            'nota_avaliacao_atual': {'read_only': True},
            'total_avaliacoes': {'read_only': True},
            'saldo_pontos': {'read_only': True},
        }

    def create(self, validated_data):
        try:
            # Extrai endereço
            rua = validated_data.get("rua")
            numero = validated_data.get("numero")
            bairro = validated_data.get("bairro")
            cidade = validated_data.get("cidade")
            estado = validated_data.get("estado")
            cep = validated_data.get("cep")

            # Tenta geocodificar
            ponto = geocode_address(rua, numero, bairro, cidade, estado, cep)
            if ponto:
                validated_data["geom"] = ponto

            return super().create(validated_data)

        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class ColetorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coletor
        # ATUALIZADO: 'cpf' e novos campos
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf',
            'cep', 'cidade', 'estado', 'geom',
            'nota_avaliacao_atual', 'total_avaliacoes'
        ]
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True},
            'nota_avaliacao_atual': {'read_only': True},
            'total_avaliacoes': {'read_only': True},
        }

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class CooperativaRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooperativa
        # ATUALIZADO: 'id' é read_only
        fields = [
            'id', 'nome_empresa', 'email', 'senha', 'telefone', 'cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'geom'
        ]
        extra_kwargs = {'senha': {'write_only': True},
                        'id': {'read_only': True}}

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))

# --- Serializer de Login (Sem alterações, mas ajustado para 'cpf_cnpj') ---


class LoginSerializer(serializers.Serializer):
    # O frontend envia 'email', que pode ser email OU cpf/cnpj
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)

# --- Serializer para Itens (Atualizado) ---


class ItemColetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemColeta
        # ATUALIZADO: Campos corretos para criação
        fields = ['tipo_residuo', 'quantidade', 'unidade_medida']

# --- Serializer para CRIAR Solicitação (Atualizado) ---


class SolicitacaoColetaCreateSerializer(serializers.ModelSerializer):
    itens = ItemColetaSerializer(many=True)

    class Meta:
        model = SolicitacaoColeta

        fields = [
            'inicio_coleta',
            'fim_coleta',
            'observacoes',
            'itens'
        ]
        extra_kwargs = {
            'observacoes': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def create(self, validated_data):
        try:
            itens_data = validated_data.pop('itens')
            solicitacao = SolicitacaoColeta.objects.create(**validated_data)
            for item_data in itens_data:
                ItemColeta.objects.create(solicitacao=solicitacao, **item_data)
            return solicitacao
        except Exception as e:
            raise serializers.ValidationError(
                {'detail': f'Erro ao criar solicitação: {str(e)}'})

# --- Serializer para LISTAR Solicitações (Atualizado) ---


class SolicitacaoColetaListSerializer(serializers.ModelSerializer):
    coletor_nome = serializers.CharField(
        source='coletor.nome', read_only=True, allow_null=True)
    itens_count = serializers.SerializerMethodField()
    tipos = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    # Nested com dados resumidos do produtor (inclui endereço)
    class ProdutorResumoSerializer(serializers.ModelSerializer):
        latitude = serializers.SerializerMethodField()
        longitude = serializers.SerializerMethodField()

        class Meta:
            model = Produtor
            fields = [
                'id', 'nome', 'email', 'telefone', 'cep',
                'rua', 'numero', 'bairro', 'cidade', 'estado',
                'latitude', 'longitude'   # <-- CORRIGIDO
            ]

        def get_latitude(self, obj):
            return obj.geom.y if obj.geom else None

        def get_longitude(self, obj):
            return obj.geom.x if obj.geom else None

    produtor = ProdutorResumoSerializer(read_only=True)

    class Meta:
        model = SolicitacaoColeta
        fields = [
            'solicitacao',
            'id', 'inicio_coleta', 'fim_coleta', 'status',
            'status_display', 'coletor_nome', 'itens_count', 'tipos',
            'observacoes', 'produtor'
        ]
        read_only_fields = fields

    def get_itens_count(self, obj):
        return obj.itens.count()

    def get_tipos(self, obj):
        try:
            # Retorna uma lista simples com os tipos de resíduo presentes na solicitação
            return list(obj.itens.values_list('tipo_residuo', flat=True))
        except Exception:
            return []


class SolicitacaoColetaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado de uma solicitação, incluindo os itens (itens de coleta)."""
    coletor_nome = serializers.CharField(
        source='coletor.nome', read_only=True, allow_null=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    produtor = SolicitacaoColetaListSerializer.ProdutorResumoSerializer(
        read_only=True)
    itens = ItemColetaSerializer(many=True, read_only=True)

    class Meta:
        model = SolicitacaoColeta
        fields = [
            'solicitacao',
            'id', 'inicio_coleta', 'fim_coleta', 'status', 'status_display',
            'coletor_nome', 'produtor', 'observacoes', 'itens'
        ]
        read_only_fields = fields


class CooperativaMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CooperativaMaterial
        fields = ['tipo_residuo', 'preco_oferecido']

# --- SERIALIZER PARA AVALIAÇÃO (ISSUE #75) ---
class AvaliacaoProdutorSerializer(serializers.Serializer):
    coleta_id = serializers.IntegerField(required=True)
    nota = serializers.DecimalField(
        max_digits=3, decimal_places=2, min_value=0.0, max_value=5.0, required=True
    )
    comentario = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        # 1. Verifica se a coleta existe
        try:
            coleta = SolicitacaoColeta.objects.get(pk=data['coleta_id'])
        except SolicitacaoColeta.DoesNotExist:
            raise serializers.ValidationError("Coleta não encontrada.")
        
        # 2. Verifica se o status permite avaliação (ex: deve estar concluída)
        if coleta.status not in ['CONCLUIDA', 'CONFIRMADA', 'COLETADO']:
             raise serializers.ValidationError("Esta coleta ainda não pode ser avaliada.")

        data['coleta_obj'] = coleta
        return data

    def save(self):
        coleta = self.validated_data['coleta_obj']
        nota_nova = self.validated_data['nota']
        produtor = coleta.produtor

        # Lógica de Cálculo da Média Ponderada
        # (Média Atual * Total Atual + Nova Nota) / (Total Atual + 1)
        total_atual = produtor.total_avaliacoes
        media_atual = produtor.nota_avaliacao_atual
        
        # Convertendo para float para calcular
        nova_media = ((float(media_atual) * total_atual) + float(nota_nova)) / (total_atual + 1)
        
        # Salvando no banco
        produtor.nota_avaliacao_atual = nova_media
        produtor.total_avaliacoes += 1
        produtor.save()
        
        return produtor
