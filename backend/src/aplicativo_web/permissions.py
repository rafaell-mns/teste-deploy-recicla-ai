# backend/src/aplicativo_web/permissions.py

from rest_framework import permissions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class IsProdutor(permissions.BasePermission):
    message = "Acesso negado. Token inválido, expirado ou usuário não é um Produtor."

    def has_permission(self, request, view):
        print("\n--- Verificando permissão IsProdutor ---") 
        auth_header = request.headers.get('Authorization')
        print(f"Cabeçalho Authorization recebido: {auth_header}")

        #Pegar o token manualmente do header
        if not auth_header or not auth_header.startswith('Bearer '):
            print("DEBUG: Cabeçalho Authorization ausente ou mal formatado.")
            self.message = "Credenciais de autenticação (token Bearer) não fornecidas ou mal formatadas."
            return False

        # Pega a parte do token DEPOIS de "Bearer "
        raw_token = auth_header.split(' ')[1] 
        print(f"DEBUG: Token extraído: {raw_token[:10]}...") # Mostra só o início do token

        jwt_authenticator = JWTAuthentication()

        try:
            print("DEBUG: Tentando validar o token extraído...") 
            validated_token = jwt_authenticator.get_validated_token(raw_token)
            print("DEBUG: Token validado com sucesso.") 

            payload = validated_token.payload
            user_type = payload.get('user_type')
            user_id = payload.get('user_id') 
            print(f"DEBUG: Payload do token: user_id={user_id}, user_type={user_type}") 

            is_produtor = user_type == 'produtor'
            print(f"DEBUG: É produtor? {is_produtor}") 

            if is_produtor and user_id is not None:
                request.auth_payload = payload 
                print("DEBUG: Permissão CONCEDIDA.") 
                return True 
            else:
                 print("DEBUG: Permissão NEGADA (Não é produtor ou falta user_id).") 
                 self.message = "Acesso permitido apenas para usuários Produtores."
                 return False 

        except (InvalidToken, TokenError) as e:
            print(f"DEBUG: Erro de Token: {e}") 
            self.message = f"Token inválido ou expirado: {e}"
            return False
        except Exception as e:
            print(f"DEBUG: Erro inesperado na permissão: {e}") 
            self.message = "Erro interno ao verificar permissão."
            return False