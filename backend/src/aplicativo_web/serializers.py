# backend/src/aplicativo_web/serializers.py
from rest_framework import serializers
import re
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta, ItemColeta
from .models import CooperativaMaterial
import requests

# --- Função de geocoding (retorna dict de lat/lng em vez de Point GIS) ---
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
    return {"latitude": lat, "longitude": lon}

# --- Serializers de Registro (Atualizados para novos campos) ---

class ProdutorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produtor
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf_cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'saldo_pontos',
            'nota_avaliacao_atual', 'total_avaliacoes'
        ]
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True},
            'nota_avaliacao_atual': {'read_only': True},
            'total_avaliacoes': {'read_only': True},
            'saldo_pontos': {'read_only': True},
        }

    def create(self, validated_data):
        try:
            endereco_info = geocode_address(
                validated_data.get("rua"),
                validated_data.get("numero"),
                validated_data.get("bairro"),
                validated_data.get("cidade"),
                validated_data.get("estado"),
                validated_data.get("cep")
            )
            if endereco_info:
                validated_data["latitude"] = endereco_info["latitude"]
                validated_data["longitude"] = endereco_info["longitude"]
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class ColetorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coletor
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf',
            'cep', 'cidade', 'estado', 'nota_avaliacao_atual', 'total_avaliacoes'
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
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class CooperativaRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooperativa
        fields = [
            'id', 'nome_empresa', 'email', 'senha', 'telefone', 'cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'
        ]
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


# --- Serializer de Login ---
class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


# --- Serializer para Itens ---
class ItemColetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemColeta
        fields = ['tipo_residuo', 'quantidade', 'unidade_medida']


# --- Serializer para CRIAR Solicitação ---
class SolicitacaoColetaCreateSerializer(serializers.ModelSerializer):
    itens = ItemColetaSerializer(many=True)

    class Meta:
        model = SolicitacaoColeta
        fields = ['inicio_coleta', 'fim_coleta', 'observacoes', 'itens']
        extra_kwargs = {'observacoes': {'required': False, 'allow_null': True, 'allow_blank': True}}

    def create(self, validated_data):
        try:
            itens_data = validated_data.pop('itens')
            solicitacao = SolicitacaoColeta.objects.create(**validated_data)
            for item_data in itens_data:
                ItemColeta.objects.create(solicitacao=solicitacao, **item_data)
            return solicitacao
        except Exception as e:
            raise serializers.ValidationError({'detail': f'Erro ao criar solicitação: {str(e)}'})


# --- Serializer para LISTAR Solicitações ---
class SolicitacaoColetaListSerializer(serializers.ModelSerializer):
    coletor_nome = serializers.CharField(source='coletor.nome', read_only=True, allow_null=True)
    itens_count = serializers.SerializerMethodField()
    tipos = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class ProdutorResumoSerializer(serializers.ModelSerializer):
        class Meta:
            model = Produtor
            fields = [
                'id', 'nome', 'email', 'telefone', 'cep',
                'rua', 'numero', 'bairro', 'cidade', 'estado',
                'latitude', 'longitude'
            ]

    produtor = ProdutorResumoSerializer(read_only=True)

    class Meta:
        model = SolicitacaoColeta
        fields = [
            'solicitacao', 'id', 'inicio_coleta', 'fim_coleta', 'status',
            'status_display', 'coletor_nome', 'itens_count', 'tipos',
            'observacoes', 'produtor'
        ]
        read_only_fields = fields

    def get_itens_count(self, obj):
        return obj.itens.count()

    def get_tipos(self, obj):
        try:
            return list(obj.itens.values_list('tipo_residuo', flat=True))
        except Exception:
            return []


class SolicitacaoColetaDetailSerializer(SolicitacaoColetaListSerializer):
    itens = ItemColetaSerializer(many=True, read_only=True)


class CooperativaMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CooperativaMaterial
        fields = ['tipo_residuo', 'preco_oferecido']


# --- Serializer para Avaliação ---
class AvaliacaoProdutorSerializer(serializers.Serializer):
    coleta_id = serializers.IntegerField(required=True)
    nota = serializers.DecimalField(max_digits=3, decimal_places=2, min_value=0.0, max_value=5.0, required=True)
    comentario = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        try:
            coleta = SolicitacaoColeta.objects.get(pk=data['coleta_id'])
        except SolicitacaoColeta.DoesNotExist:
            raise serializers.ValidationError("Coleta não encontrada.")
        if coleta.status not in ['CONCLUIDA', 'CONFIRMADA', 'COLETADO']:
            raise serializers.ValidationError("Esta coleta ainda não pode ser avaliada.")
        data['coleta_obj'] = coleta
        return data

    def save(self):
        coleta = self.validated_data['coleta_obj']
        nota_nova = self.validated_data['nota']
        produtor = coleta.produtor
        total_atual = produtor.total_avaliacoes
        media_atual = produtor.nota_avaliacao_atual
        nova_media = ((float(media_atual) * total_atual) + float(nota_nova)) / (total_atual + 1)
        produtor.nota_avaliacao_atual = nova_media
        produtor.total_avaliacoes += 1
        produtor.save()
        return produtor
