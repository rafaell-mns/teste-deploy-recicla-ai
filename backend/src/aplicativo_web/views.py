# backend/src/aplicativo_web/views.py

from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from pathlib import Path
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from .serializers import AvaliacaoProdutorSerializer
from rest_framework.generics import RetrieveAPIView

from .serializers import (
    ProdutorRegistrationSerializer, ColetorRegistrationSerializer,
    CooperativaRegistrationSerializer, LoginSerializer,
    SolicitacaoColetaCreateSerializer, SolicitacaoColetaListSerializer,
    SolicitacaoColetaDetailSerializer, AvaliacaoColetorSerializer
)
from .serializers import CooperativaMaterialSerializer
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta
from .models import CooperativaMaterial
from .permissions import IsProdutor
from django.utils import timezone

# --- Views Originais (Servir Frontend e Teste) ---


def spa(request):
    index = Path(settings.BASE_DIR.parent.parent,
                 "frontend", "build", "index.html")
    if not index.exists():
        raise Http404(
            "Frontend build not found. Run `npm run build` in /frontend.")
    return FileResponse(open(index, "rb"))


def index(request):
    return HttpResponse("Olá, mundo. Você está no índice da API.")

# --- Views de Cadastro ---


class ProdutorRegisterView(generics.CreateAPIView):
    serializer_class = ProdutorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AtualizarStatusColetaView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            coleta = SolicitacaoColeta.objects.get(pk=pk)
        except SolicitacaoColeta.DoesNotExist:
            return Response({"detail": "Coleta não encontrada"}, status=404)

        novo_status = request.data.get("status")

        # O banco atual tem uma constraint que não permite valores fora
        # de: SOLICITADA, ACEITA, CANCELADA, CONFIRMADA.
        # Para evitar criar migrations (alterar constraint), mapeamos
        # 'CONCLUIDA' -> 'CONFIRMADA' no servidor. Se desejar permitir
        # 'CONCLUIDA' de verdade, gere a migration que atualiza o modelo
        # e aplique a alteração no banco.

        if novo_status is None:
            return Response({"detail": "Campo 'status' é obrigatório."}, status=400)

        if novo_status not in ["ACEITA", "CONFIRMADA", "CANCELADA", "SOLICITADA", "AGUARDANDO", "CONCLUIDA", ]:
            return Response({"detail": "Status inválido"}, status=400)

        mapped = False
        final_status = novo_status
        if novo_status == 'CONCLUIDA':
            # Mapeamento temporário para evitar violação da constraint
            final_status = 'CONFIRMADA'
            mapped = True

        # Tenta extrair o coletor autenticado (se houver) a partir do token JWT
        auth_payload = getattr(request, 'auth_payload', None)
        if not auth_payload:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                try:
                    validated = jwt_auth.get_validated_token(raw_token)
                    auth_payload = getattr(validated, 'payload', None)
                    if auth_payload:
                        request.auth_payload = auth_payload
                except Exception:
                    auth_payload = None

        # Se o usuário autenticado for um coletor e a solicitação ainda não tiver coletor,
        # associa o coletor autenticado à solicitação.
        associado = False
        if auth_payload and auth_payload.get('user_type') == 'coletor' and auth_payload.get('user_id'):
            try:
                coletor_id = auth_payload.get('user_id')
                coletor_profile = Coletor.objects.filter(pk=coletor_id).first()
                if coletor_profile and coleta.coletor is None:
                    coleta.coletor = coletor_profile
                    associado = True
            except Exception:
                # não falha a operação só por não conseguir associar o coletor
                associado = False

        coleta.status = final_status
        coleta.save()

        resp = {"id": coleta.id, "status": coleta.status}
        if mapped:
            resp["note"] = "Status 'CONCLUIDA' mapeado para 'CONFIRMADA' (constraint do DB)."
        if associado:
            resp["coletor_associado"] = coleta.coletor_id

        return Response(resp)


class ColetorRegisterView(generics.CreateAPIView):
    serializer_class = ColetorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CooperativaRegisterView(generics.CreateAPIView):
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CooperativaListView(generics.ListAPIView):
    """Lista cooperativas cadastradas (para uso pelo frontend)."""
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            return Cooperativa.objects.all().order_by('id')
        except Exception as e:
            print(f"Erro ao listar cooperativas: {e}")
            return Cooperativa.objects.none()

# --- View de Login Customizada (Atualizada) ---


class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Renomeado para 'identifier' para refletir que pode ser email ou documento
        identifier = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = None
        user_type = None

        # 1) Tenta por email
        if Produtor.objects.filter(email=identifier).exists():
            user = Produtor.objects.get(email=identifier)
            user_type = 'produtor'
        elif Coletor.objects.filter(email=identifier).exists():
            user = Coletor.objects.get(email=identifier)
            user_type = 'coletor'
        elif Cooperativa.objects.filter(email=identifier).exists():
            user = Cooperativa.objects.get(email=identifier)
            user_type = 'cooperativa'
        else:
            # 2) Tenta por documento (CPF/CNPJ)
            # ATUALIZADO: Produtor agora usa 'cpf_cnpj'
            if Produtor.objects.filter(cpf_cnpj=identifier).exists():
                user = Produtor.objects.get(cpf_cnpj=identifier)
                user_type = 'produtor'
            elif Coletor.objects.filter(cpf=identifier).exists():
                user = Coletor.objects.get(cpf=identifier)
                user_type = 'coletor'
            elif Cooperativa.objects.filter(cnpj=identifier).exists():
                user = Cooperativa.objects.get(cnpj=identifier)
                user_type = 'cooperativa'

        if user and user.senha == password:
            # Determina o nome a ser retornado conforme o tipo de usuário
            if user_type == 'cooperativa':
                display_name = getattr(user, 'nome_empresa', None) or getattr(
                    user, 'nome', None) or getattr(user, 'email', '')
            else:
                display_name = getattr(user, 'nome', None) or getattr(
                    user, 'nome_empresa', None) or getattr(user, 'email', '')

            refresh = RefreshToken()
            refresh['user_id'] = user.pk
            refresh['user_type'] = user_type
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type,
                'name': display_name,
            }, status=status.HTTP_200_OK)

        return Response(
            {'detail': 'Nenhuma conta ativa encontrada com as credenciais fornecidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

# --- View para Criar Solicitação de Coleta ---


class SolicitarColetaView(generics.CreateAPIView):
    serializer_class = SolicitacaoColetaCreateSerializer
    permission_classes = [IsProdutor]

    def perform_create(self, serializer):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                raise AttributeError
            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            # grava o timestamp exato da solicitação no servidor
            serializer.save(produtor=produtor_profile,
                            solicitacao=timezone.now())
        except Produtor.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Perfil de Produtor não encontrado."})
        except AttributeError:
            raise serializers.ValidationError(
                {"detail": "Informação de autenticação não encontrada."})
        except Exception as e:
            raise serializers.ValidationError(
                {"detail": f"Erro inesperado: {e}"})

# --- View para Listar Minhas Solicitações ---


class MinhasSolicitacoesView(generics.ListAPIView):
    serializer_class = SolicitacaoColetaListSerializer
    permission_classes = [IsProdutor]

    def get_queryset(self):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                return SolicitacaoColeta.objects.none()

            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            return SolicitacaoColeta.objects.filter(produtor=produtor_profile).select_related('coletor').order_by('-id')
        except Produtor.DoesNotExist:
            return SolicitacaoColeta.objects.none()


class DisponiveisSolicitacoesView(generics.ListAPIView):
    """Lista todas as solicitações de coleta disponíveis (status = 'SOLICITADA').
    Usado pelo Coletor/Frontend para ver coletas pendentes no sistema.
    """
    serializer_class = SolicitacaoColetaListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            return SolicitacaoColeta.objects.filter(status='SOLICITADA').order_by('-id')
        except Exception as e:
            print(f"Erro ao buscar coletas disponiveis: {e}")
            return SolicitacaoColeta.objects.none()
        except Exception as e:
            print(f"Erro ao buscar solicitações: {e}")
            return SolicitacaoColeta.objects.none()


class SolicitacaoColetaDetailView(generics.RetrieveDestroyAPIView):
    """Retorna detalhes de uma solicitação de coleta e permite que o produtor que a criou a delete.
    A exclusão só é permitida quando o status estiver como 'SOLICITADA'.
    """
    queryset = SolicitacaoColeta.objects.all()
    serializer_class = SolicitacaoColetaDetailSerializer
    permission_classes = [permissions.AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            # tenta extrair payload de autenticação (pode estar definido por middleware)
            auth_payload = getattr(request, 'auth_payload', None)
            if not auth_payload:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or 'user_id' not in auth_payload:
                return Response({'detail': 'Autenticação necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

            user_id = auth_payload.get('user_id')
            coleta = self.get_object()

            # só o produtor dono pode deletar
            if coleta.produtor_id != user_id:
                return Response({'detail': 'Somente o produtor dono da solicitação pode deletá-la.'}, status=status.HTTP_403_FORBIDDEN)

            # só permite exclusão se ainda estiver SOLICITADA
            if coleta.status != 'SOLICITADA':
                return Response({'detail': 'Só coletas com status SOLICITADA podem ser canceladas/excluídas.'}, status=status.HTTP_400_BAD_REQUEST)

            coleta.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'detail': f'Erro inesperado: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MinhasSolicitacoesColetorView(generics.ListAPIView):
    """Lista as solicitações associadas ao coletor autenticado (coletor.coletas).
    Retorna solicitações onde `coletor` == coletor autenticado. Usa o serializer detalhado
    para incluir os itens de coleta no payload, facilitando a exibição no frontend.
    """
    serializer_class = SolicitacaoColetaDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            # tenta extrair token do header se auth_payload não estiver definido
            if not auth_payload:
                auth_header = self.request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            self.request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or 'user_id' not in auth_payload or auth_payload.get('user_type') != 'coletor':
                return SolicitacaoColeta.objects.none()

            coletor_id = auth_payload.get('user_id')
            coletor_profile = Coletor.objects.filter(pk=coletor_id).first()
            if not coletor_profile:
                return SolicitacaoColeta.objects.none()

            return SolicitacaoColeta.objects.filter(coletor=coletor_profile).order_by('-id')
        except Exception as e:
            print(f"Erro ao buscar coletas do coletor: {e}")
            return SolicitacaoColeta.objects.none()


class AcceptSolicitacaoView(APIView):
    """Permite que um Coletor autenticado aceite uma solicitação de coleta.
    O coletor é recuperado a partir do payload de autenticação (como nas outras views).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk, *args, **kwargs):
        try:
            auth_payload = getattr(request, 'auth_payload', None)
            # Se a autenticação já não foi feita por uma permission (ex: IsProdutor), tentamos extrair o token do header
            if not auth_payload:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        # salva para uso posterior
                        if auth_payload:
                            request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or 'user_id' not in auth_payload or auth_payload.get('user_type') != 'coletor':
                return Response({'detail': 'Autenticação de coletor necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

            # A partir daqui, temos um coletor autenticado — realiza a associação da solicitação
            coletor_id = auth_payload.get('user_id')
            try:
                coletor_profile = Coletor.objects.get(pk=coletor_id)
            except Coletor.DoesNotExist:
                return Response({'detail': 'Perfil de Coletor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            try:
                solicit = SolicitacaoColeta.objects.get(pk=pk)
            except SolicitacaoColeta.DoesNotExist:
                return Response({'detail': 'Solicitação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

            # Verifica se a solicitação ainda está disponível
            if solicit.status != 'SOLICITADA':
                return Response({'detail': 'Solicitação não está disponível para aceitação.'}, status=status.HTTP_400_BAD_REQUEST)

            solicit.coletor = coletor_profile
            solicit.status = 'ACEITA'
            solicit.save()

            serializer = SolicitacaoColetaDetailSerializer(solicit)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': f'Erro inesperado: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CooperativaInteressesView(APIView):
    """Recebe a lista de interesses (tipo_residuo, preco) e atualiza a tabela
    `cooperativa_material` para a cooperativa autenticada.
    Payload esperado: {"interesses": [{"categoria": "Plástico", "preco": "R$ 2,50/kg"}, ...]}
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        """Retorna a lista de interesses (tipo_residuo, preco_oferecido) da cooperativa autenticada."""
        # tenta extrair payload de autenticação (como em outras views)
        auth_payload = getattr(request, 'auth_payload', None)
        if not auth_payload:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                try:
                    validated = jwt_auth.get_validated_token(raw_token)
                    auth_payload = getattr(validated, 'payload', None)
                    if auth_payload:
                        request.auth_payload = auth_payload
                except Exception:
                    auth_payload = None

        if not auth_payload or auth_payload.get('user_type') != 'cooperativa' or 'user_id' not in auth_payload:
            return Response({'detail': 'Autenticação de cooperativa necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

        coop_id = auth_payload.get('user_id')
        qs = CooperativaMaterial.objects.filter(cooperativa_id=coop_id)
        serializer = CooperativaMaterialSerializer(qs, many=True)
        # Retornamos em um campo 'interesses' para compatibilidade com frontend
        return Response({'interesses': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        # tenta extrair payload de autenticação (como em outras views)
        auth_payload = getattr(request, 'auth_payload', None)
        if not auth_payload:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                try:
                    validated = jwt_auth.get_validated_token(raw_token)
                    auth_payload = getattr(validated, 'payload', None)
                    if auth_payload:
                        request.auth_payload = auth_payload
                except Exception:
                    auth_payload = None

        if not auth_payload or auth_payload.get('user_type') != 'cooperativa' or 'user_id' not in auth_payload:
            return Response({'detail': 'Autenticação de cooperativa necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

        coop_id = auth_payload.get('user_id')

        interesses = request.data.get('interesses')
        if interesses is None or not isinstance(interesses, list):
            return Response({'detail': "Campo 'interesses' inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # Helper para converter preço em Decimal
        import re
        from decimal import Decimal

        def parse_price(p):
            if p is None:
                return None
            if isinstance(p, (int, float, Decimal)):
                return Decimal(str(p))
            s = str(p)
            # remove R$, /kg, spaces e letras
            s = s.replace('R$', '').replace('r$', '')
            s = re.sub(r"[^0-9,\.\-]", '', s)
            s = s.replace(',', '.')
            try:
                return Decimal(s)
            except Exception:
                return None

        processed_types = []
        for item in interesses:
            tipo = item.get('categoria') or item.get('tipo_residuo')
            preco_raw = item.get('preco') or item.get('preco_oferecido')
            if not tipo:
                continue
            preco = parse_price(preco_raw)
            if preco is None:
                continue
            # create or update
            CooperativaMaterial.objects.update_or_create(
                cooperativa_id=coop_id,
                tipo_residuo=tipo,
                defaults={'preco_oferecido': preco}
            )
            processed_types.append(tipo)

        # Remove materiais existentes que não estão na lista enviada
        CooperativaMaterial.objects.filter(cooperativa_id=coop_id).exclude(
            tipo_residuo__in=processed_types).delete()

        return Response({'detail': 'Interesses atualizados com sucesso.'}, status=status.HTTP_200_OK)


class AssociarCooperativaView(APIView):
    """Permite que um Coletor autenticado associe uma cooperativa a uma solicitação (campo cooperativa_id).
    Endpoint: PATCH /api/coletas/<pk>/associar_cooperativa/
    Payload esperado: { "cooperativa_id": <id> }
    """
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            # tenta extrair payload de autenticação (pode já estar em request.auth_payload)
            auth_payload = getattr(request, 'auth_payload', None)
            if not auth_payload:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or auth_payload.get('user_type') != 'coletor' or 'user_id' not in auth_payload:
                return Response({'detail': 'Autenticação de coletor necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

            try:
                coleta = SolicitacaoColeta.objects.get(pk=pk)
            except SolicitacaoColeta.DoesNotExist:
                return Response({'detail': 'Solicitação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

            coop_id = request.data.get(
                'cooperativa_id') or request.data.get('cooperativa')
            if coop_id is None:
                return Response({'detail': "Campo 'cooperativa_id' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                coop = Cooperativa.objects.get(pk=coop_id)
            except Cooperativa.DoesNotExist:
                return Response({'detail': 'Cooperativa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

            # Associa e salva
            coleta.cooperativa = coop
            coleta.save()

            serializer = SolicitacaoColetaDetailSerializer(coleta)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': f'Erro inesperado: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- VIEW PARA AVALIAR PRODUTOR (ISSUE #75) ---
class AvaliarProdutorView(APIView):
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        # 1. Autenticação Manual (verificar se é Coletor)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
             return Response({'detail': 'Token não fornecido.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            raw_token = auth_header.split(' ')[1]
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(raw_token)
            
            user_type = validated_token.payload.get('user_type')
            user_id = validated_token.payload.get('user_id')

            if user_type != 'coletor':
                return Response({'detail': 'Apenas coletores podem avaliar produtores.'}, status=status.HTTP_403_FORBIDDEN)

        except Exception as e:
             return Response({'detail': 'Token inválido.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 2. Processar Avaliação
        serializer = AvaliacaoProdutorSerializer(data=request.data)
        if serializer.is_valid():
            # Opcional: Verificar se a coleta pertence a este coletor
            coleta = SolicitacaoColeta.objects.get(pk=request.data['coleta_id'])
            if coleta.coletor_id != user_id:
                 return Response({'detail': 'Você não pode avaliar uma coleta que não é sua.'}, status=status.HTTP_403_FORBIDDEN)

            serializer.save()
            return Response({'detail': 'Avaliação enviada com sucesso!'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# --- View para o Produtor ver seu Perfil/Nota ---
class ProdutorPerfilView(APIView):
    permission_classes = [IsProdutor]

    def get(self, request):
        try:
            # Pega o ID do usuário logado (do token)
            auth_payload = getattr(request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                 return Response({'detail': 'Erro de autenticação.'}, status=status.HTTP_401_UNAUTHORIZED)

            user_id = auth_payload.get('user_id')
            produtor = Produtor.objects.get(pk=user_id)
            
            return Response({
                "nome": produtor.nome,
                "email": produtor.email,
                "nota_avaliacao_atual": produtor.nota_avaliacao_atual,
                "total_avaliacoes": produtor.total_avaliacoes,
                "saldo_pontos": produtor.saldo_pontos
            })
        except Produtor.DoesNotExist:
            return Response({'detail': 'Produtor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        

class AvaliarColetorView(APIView):
    """
    Endpoint: POST /api/avaliar/coletor/
    Segue o mesmo padrão de AvaliarProdutor: não usa autenticação aqui,
    apenas valida a coleta e atualiza a média do coletor.
    """

    def post(self, request, *args, **kwargs):
        serializer = AvaliacaoColetorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Avaliação do coletor registrada com sucesso."},
            status=status.HTTP_200_OK,
        )
    
class EntregasPendentesCooperativaView(generics.ListAPIView):
    """
    Lista as solicitações associadas à cooperativa autenticada
    que estão aguardando confirmação da entrega (status = 'AGUARDANDO').
    Usado pelo frontend na aba "Confirmar Entregas" da cooperativa.
    """
    serializer_class = SolicitacaoColetaDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)

            # Tenta extrair o payload do token JWT, como no resto do código
            if not auth_payload:
                auth_header = self.request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            self.request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            # Precisa ser cooperativa autenticada
            if (
                not auth_payload
                or auth_payload.get('user_type') != 'cooperativa'
                or 'user_id' not in auth_payload
            ):
                return SolicitacaoColeta.objects.none()

            coop_id = auth_payload.get('user_id')

            # Filtra coletas dessa cooperativa, em status AGUARDANDO
            return (
                SolicitacaoColeta.objects
                .filter(cooperativa_id=coop_id, status='AGUARDANDO')
                .select_related('coletor', 'produtor', 'cooperativa')
                .order_by('-id')
            )
        except Exception as e:
            print(f"Erro ao buscar entregas pendentes da cooperativa: {e}")
            return SolicitacaoColeta.objects.none()

class ProdutorPerfilView(APIView):
    permission_classes = [IsProdutor]

    def get(self, request):
        try:
            # Pega o ID do usuário logado (do token)
            auth_payload = getattr(request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                 return Response({'detail': 'Erro de autenticação.'}, status=status.HTTP_401_UNAUTHORIZED)

            user_id = auth_payload.get('user_id')
            produtor = Produtor.objects.get(pk=user_id)
            
            return Response({
                "nome": produtor.nome,
                "email": produtor.email,
                "nota_avaliacao_atual": produtor.nota_avaliacao_atual,
                "total_avaliacoes": produtor.total_avaliacoes,
                "saldo_pontos": produtor.saldo_pontos
            })
        except Produtor.DoesNotExist:
            return Response({'detail': 'Produtor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


# --- NOVA View para o Coletor ver seu Perfil/Nota ---
class ColetorPerfilView(APIView):
    """
    Retorna informações básicas e a nota média do Coletor autenticado.
    Endpoint: GET /api/coletor/perfil/
    """
    permission_classes = [permissions.AllowAny]  # validação por token manualmente

    def get(self, request):
        try:
            # Tenta recuperar payload já decodificado (middleware/permission)
            auth_payload = getattr(request, 'auth_payload', None)

            # Se não existir, tenta extrair do header Authorization
            if not auth_payload:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            # Verifica se é um coletor autenticado
            if (
                not auth_payload
                or auth_payload.get('user_type') != 'coletor'
                or 'user_id' not in auth_payload
            ):
                return Response(
                    {'detail': 'Autenticação de coletor necessária.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user_id = auth_payload.get('user_id')

            try:
                coletor = Coletor.objects.get(pk=user_id)
            except Coletor.DoesNotExist:
                return Response(
                    {'detail': 'Coletor não encontrado.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response({
                "nome": coletor.nome,
                "email": coletor.email,
                "nota_avaliacao_atual": coletor.nota_avaliacao_atual,
                "total_avaliacoes": coletor.total_avaliacoes,
            })

        except Exception as e:
            return Response(
                {'detail': f'Erro inesperado: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )