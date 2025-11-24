from django.contrib import admin
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta, ItemColeta

admin.site.register(Produtor)
admin.site.register(Coletor)
admin.site.register(Cooperativa)
admin.site.register(SolicitacaoColeta)
admin.site.register(ItemColeta)
