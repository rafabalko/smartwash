import random
from django.utils import timezone
from django.db.models import Sum
from django.core.mail import send_mail
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework import serializers
from django.contrib.auth.models import User

from .models import PerfilUsuario, Estabelecimento, Favorito, Veiculo, Servico, Agendamento, VerificacaoEmail, Avaliacao
from .serializers import (
    PerfilUsuarioSerializer, EstabelecimentoSerializer,
    VeiculoSerializer, ServicoSerializer, AgendamentoSerializer,
    CadastroSerializer, AvaliacaoSerializer
)


class CustomAuthToken(ObtainAuthToken):
    """
    Endpoint customizado de login para retornar o Token HTTP
    juntamente com as informações do perfil (ADMIN ou CLIENTE).
    """

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        perfil, _ = PerfilUsuario.objects.get_or_create(user=user)

        if user.is_superuser and perfil.tipo != 'ADMIN':
            perfil.tipo = 'ADMIN'
            perfil.save()

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'tipo': perfil.tipo,
            'estabelecimento_id': perfil.estabelecimento.id if perfil.estabelecimento else None
        })


class CadastroView(APIView):
    """
    Endpoint público para cadastro de novos clientes com geração de código de verificação por e-mail.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CadastroSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            verificacao, _ = VerificacaoEmail.objects.get_or_create(user=user)
            verificacao.codigo = str(random.randint(100000, 999999))
            verificacao.save()

            try:
                send_mail(
                    subject='SmartWash - Código de Verificação',
                    message=f'Olá {user.first_name or user.username}, o seu código de verificação para ativar a conta no SmartWash é: {verificacao.codigo}',
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erro ao enviar e-mail: {e}")

            return Response({
                'mensagem': 'Registo efetuado com sucesso! Verifique o seu e-mail para obter o código de ativação.'
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CadastroEstabelecimentoView(APIView):
    """
    Novo fluxo de cadastro sem CNPJ. Foco na facilidade e conversão.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')
        nome_dono = data.get('nome_dono', '')
        nome_fantasia = data.get('nome_fantasia')
        endereco = data.get('endereco')
        telefone = data.get('telefone', '')

        if not password or not email or not nome_fantasia or not endereco:
            return Response({'error': 'Preencha todos os campos obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            return Response({'error': 'Este e-mail já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=nome_dono
        )

        estabelecimento = Estabelecimento.objects.create(
            nome_fantasia=nome_fantasia,
            endereco=endereco,
            telefone=telefone,
            descricao="Estabelecimento parceiro SmartWash",
            ativo=True,
            dono=user
        )

        PerfilUsuario.objects.create(
            user=user,
            tipo='ADMIN',
            estabelecimento=estabelecimento,
            telefone=telefone
        )

        verificacao, _ = VerificacaoEmail.objects.get_or_create(user=user)
        verificacao.codigo = str(random.randint(100000, 999999))
        verificacao.save()

        try:
            send_mail(
                subject='SmartWash - Ative seu Lava-Rápido',
                message=f'Olá {nome_dono}! Falta pouco para o {nome_fantasia} estar online.\n\nO seu código de verificação é: {verificacao.codigo}',
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Erro ao enviar e-mail: {e}")

        return Response({
            'mensagem': 'Lava-Rápido registado! Verifique o seu e-mail para obter o código de ativação.'
        }, status=status.HTTP_201_CREATED)


class ValidarCodigoEmailView(APIView):

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        codigo = request.data.get('codigo')

        if not email or not codigo:
            return Response({'erro': 'E-mail e código são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(email=email).order_by('-date_joined').first()

            if not user:
                return Response({'erro': 'Utilizador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            verificacao = VerificacaoEmail.objects.get(user=user)

            if verificacao.codigo == codigo:
                verificacao.delete()
                token, _ = Token.objects.get_or_create(user=user)
                perfil, _ = PerfilUsuario.objects.get_or_create(user=user)

                return Response({
                    'token': token.key,
                    'user_id': user.pk,
                    'username': user.username,
                    'tipo': perfil.tipo,
                    'mensagem': 'E-mail verificado com sucesso!'
                }, status=status.HTTP_200_OK)
            else:
                return Response({'erro': 'Código inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        except VerificacaoEmail.DoesNotExist:
            return Response({'erro': 'Código de verificação não encontrado para este utilizador.'},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'erro': f'Ocorreu um erro: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



class SolicitarResetSenhaView(APIView):
    """
    Gera um código de 6 dígitos e envia para o e-mail do usuário
    que deseja recuperar a senha.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'erro': 'O e-mail é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            verificacao, _ = VerificacaoEmail.objects.get_or_create(user=user)
            verificacao.codigo = str(random.randint(100000, 999999))
            verificacao.save()

            try:
                send_mail(
                    subject='SmartWash - Recuperação de Senha',
                    message=f'Olá! Você solicitou a recuperação de senha.\n\nO seu código de verificação é: {verificacao.codigo}\n\nSe você não solicitou isso, ignore este e-mail.',
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erro ao enviar e-mail de reset: {e}")

        return Response({'mensagem': 'Se o e-mail estiver cadastrado, um código foi enviado.'},
                        status=status.HTTP_200_OK)


class ConfirmarResetSenhaView(APIView):
    """
    Valida o código de 6 dígitos e salva a nova senha criptografada.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        codigo = request.data.get('codigo')
        nova_senha = request.data.get('nova_senha')

        if not email or not codigo or not nova_senha:
            return Response({'erro': 'E-mail, código e nova senha são obrigatórios.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({'erro': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            verificacao = VerificacaoEmail.objects.get(user=user)

            if verificacao.codigo == codigo:
                user.set_password(nova_senha)
                user.save()
                verificacao.delete()

                return Response({'mensagem': 'Senha alterada com sucesso!'}, status=status.HTTP_200_OK)
            else:
                return Response({'erro': 'Código inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        except VerificacaoEmail.DoesNotExist:
            return Response({'erro': 'Nenhum código de recuperação pendente para este e-mail.'},
                            status=status.HTTP_400_BAD_REQUEST)



class CriarNovoAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        perfil_solicitante, _ = PerfilUsuario.objects.get_or_create(user=request.user)

        if perfil_solicitante.tipo != 'ADMIN' and not request.user.is_superuser:
            return Response(
                {'error': 'Apenas administradores podem cadastrar novos funcionários.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        username = data.get('username')
        email = data.get('email', '')
        password = data.get('password')
        nome = data.get('nome', '')

        if not username or not password:
            return Response({'error': 'Usuário e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Este nome de usuário já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)

        novo_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nome
        )

        PerfilUsuario.objects.create(
            user=novo_user,
            tipo='ADMIN',
            estabelecimento=perfil_solicitante.estabelecimento
        )

        nome_est = perfil_solicitante.estabelecimento.nome_fantasia if perfil_solicitante.estabelecimento else 'Sistema'
        return Response(
            {'message': f'Funcionário {username} cadastrado com sucesso para {nome_est}!'},
            status=status.HTTP_201_CREATED
        )


class RemoverFuncionarioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        perfil_admin = PerfilUsuario.objects.filter(user=request.user, tipo='ADMIN').first()
        if not perfil_admin and not request.user.is_superuser:
            return Response({'error': 'Ação permitida apenas para administradores.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.id == user_id:
            return Response({'error': 'Você não pode remover seu próprio acesso por aqui.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            funcionario = User.objects.get(id=user_id)
            Token.objects.filter(user=funcionario).delete()
            funcionario.delete()
            return Response({'message': 'Acesso do funcionário removido com sucesso!'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Funcionário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        perfil_solicitante, _ = PerfilUsuario.objects.get_or_create(user=user)

        if user.is_superuser:
            return PerfilUsuario.objects.all()

        if perfil_solicitante.tipo == 'ADMIN':
            if perfil_solicitante.estabelecimento:
                return PerfilUsuario.objects.filter(estabelecimento=perfil_solicitante.estabelecimento)
            return PerfilUsuario.objects.filter(tipo='ADMIN')

        return PerfilUsuario.objects.filter(user=user)

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        perfil, _ = PerfilUsuario.objects.get_or_create(user=request.user)

        if request.method == 'GET':
            serializer = self.get_serializer(perfil)
            return Response(serializer.data, status=status.HTTP_200_OK)

        user = request.user
        user_data = request.data.get('user', {})

        if isinstance(user_data, dict) and user_data:
            if 'first_name' in user_data: user.first_name = user_data['first_name']
            if 'last_name' in user_data: user.last_name = user_data['last_name']
            if 'email' in user_data: user.email = user_data['email']
        else:
            if 'first_name' in request.data: user.first_name = request.data.get('first_name') or ''
            if 'last_name' in request.data: user.last_name = request.data.get('last_name') or ''
            if 'email' in request.data: user.email = request.data.get('email') or ''
        user.save()

        if 'telefone' in request.data: perfil.telefone = request.data.get('telefone') or ''
        if 'genero' in request.data: perfil.genero = request.data.get('genero') or ''

        data_nasc = request.data.get('data_nascimento')
        if data_nasc and str(data_nasc).strip() not in ['', 'null', 'None']:
            perfil.data_nascimento = data_nasc
        else:
            perfil.data_nascimento = None

        perfil.save()

        serializer = self.get_serializer(perfil)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EstabelecimentoViewSet(viewsets.ModelViewSet):
    serializer_class = EstabelecimentoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            perfil = getattr(user, 'perfil', None)

            if perfil and perfil.tipo == 'ADMIN':
                if perfil.estabelecimento:
                    return Estabelecimento.objects.filter(id=perfil.estabelecimento.id)
                return Estabelecimento.objects.filter(dono=user, ativo=True)

        return Estabelecimento.objects.filter(ativo=True)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favoritar(self, request, pk=None):
        estabelecimento = self.get_object()
        fav, created = Favorito.objects.get_or_create(cliente=request.user, estabelecimento=estabelecimento)
        if not created:
            fav.delete()
            return Response({'status': 'removido dos favoritos', 'is_favorito': False}, status=200)
        return Response({'status': 'adicionado aos favoritos', 'is_favorito': True}, status=200)


class VeiculoViewSet(viewsets.ModelViewSet):
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Veiculo.objects.filter(cliente=self.request.user)

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)


class ServicoViewSet(viewsets.ModelViewSet):
    serializer_class = ServicoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        est_id = self.request.query_params.get('estabelecimento')
        if est_id:
            return Servico.objects.filter(estabelecimento_id=est_id, ativo=True)
        return Servico.objects.filter(ativo=True)

    def perform_create(self, serializer):
        perfil = PerfilUsuario.objects.filter(user=self.request.user).first()
        estabelecimento = perfil.estabelecimento if perfil else None

        if not estabelecimento and self.request.user.is_superuser:
            estabelecimento = Estabelecimento.objects.first()

        serializer.save(estabelecimento=estabelecimento)


class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        perfil, _ = PerfilUsuario.objects.get_or_create(user=user)

        if user.is_superuser:
            return Agendamento.objects.all().order_by('data_hora_inicio')

        if perfil.tipo == 'ADMIN':
            if perfil.estabelecimento:
                return Agendamento.objects.filter(estabelecimento=perfil.estabelecimento).order_by('data_hora_inicio')
            return Agendamento.objects.filter(estabelecimento__dono=user).order_by('data_hora_inicio')

        return Agendamento.objects.filter(cliente=user).order_by('data_hora_inicio')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def horarios_ocupados(self, request):
        estabelecimento_id = request.query_params.get('estabelecimento')
        data_str = request.query_params.get('data')

        if not estabelecimento_id or not data_str:
            return Response({"erro": "Informe o estabelecimento e a data."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_alvo = timezone.datetime.strptime(data_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"erro": "Formato de data inválido. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        agendamentos = Agendamento.objects.filter(
            estabelecimento_id=estabelecimento_id,
            data_hora_inicio__date=data_alvo
        ).exclude(status='CANCELADO')

        horarios = []
        for ag in agendamentos:
            inicio_local = timezone.localtime(ag.data_hora_inicio)

            duracao_min = ag.servico.duracao_em_minutos if ag.servico else 30
            fim_local = inicio_local + timezone.timedelta(minutes=duracao_min)

            horarios.append({
                "inicio": inicio_local.strftime('%H:%M'),
                "fim": fim_local.strftime('%H:%M')
            })

        return Response(horarios, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        user = self.request.user
        telefone_enviado = self.request.data.get('telefone')
        if telefone_enviado:
            perfil, _ = PerfilUsuario.objects.get_or_create(user=user)
            perfil.telefone = telefone_enviado
            perfil.save()

        serializer.save(cliente=user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def faturamento_diario(self, request):
        user = self.request.user
        perfil = getattr(user, 'perfil', None)

        data_str = request.query_params.get('data')
        if data_str:
            try:
                data_alvo = timezone.datetime.strptime(data_str, '%Y-%m-%d').date()
            except ValueError:
                data_alvo = timezone.now().date()
        else:
            data_alvo = timezone.now().date()

        agendamentos = Agendamento.objects.filter(
            status='CONCLUIDO',
            data_hora_inicio__date=data_alvo
        )

        if user.is_superuser:
            pass
        elif perfil and perfil.tipo == 'ADMIN':
            if perfil.estabelecimento:
                agendamentos = agendamentos.filter(estabelecimento=perfil.estabelecimento)
            else:
                agendamentos = agendamentos.filter(estabelecimento__dono=user)
        else:
            agendamentos = agendamentos.none()

        faturamento_hoje = agendamentos.aggregate(total=Sum('servico__preco'))['total'] or 0.00

        return Response({
            'faturamento_hoje': faturamento_hoje,
            'data_filtrada': data_alvo.strftime('%Y-%m-%d')
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def atualizar_status(self, request, pk=None):
        agendamento = self.get_object()
        novo_status = request.data.get('status')

        if not novo_status:
            return Response({'error': 'O campo status é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        agendamento.status = novo_status
        agendamento.save()

        serializer = self.get_serializer(agendamento)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def cancelar(self, request, pk=None):
        agendamento = self.get_object()
        motivo = request.data.get('motivo', '')

        if agendamento.cliente != request.user and not request.user.is_superuser:
            perfil = getattr(request.user, 'perfil', None)
            if not perfil or perfil.tipo != 'ADMIN':
                return Response(
                    {'error': 'Você não tem permissão para cancelar este agendamento.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if agendamento.status == 'CONCLUIDO':
            return Response(
                {'error': 'Não é possível cancelar um agendamento já concluído.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agendamento.status = 'CANCELADO'
        if motivo:
            agendamento.motivo_cancelamento = motivo
        agendamento.save()

        return Response({'status': 'Agendamento cancelado com sucesso!'}, status=status.HTTP_200_OK)


class IsOwnerOfAvaliacaoOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        return obj.cliente.user == request.user


class AvaliacaoViewSet(viewsets.ModelViewSet):
    serializer_class = AvaliacaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOfAvaliacaoOrReadOnly]

    def get_queryset(self):
        est_id = self.request.query_params.get('estabelecimento')
        if est_id:
            return Avaliacao.objects.filter(estabelecimento_id=est_id)
        return Avaliacao.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        perfil, _ = PerfilUsuario.objects.get_or_create(user=user)
        agendamento = serializer.validated_data.get('agendamento')

        if agendamento.cliente != user:
            raise serializers.ValidationError({'agendamento': 'Você só pode avaliar os seus próprios agendamentos.'})

        if agendamento.status != 'CONCLUIDO':
            raise serializers.ValidationError({'agendamento': 'Você só pode avaliar serviços que já foram concluídos.'})

        if not self.request.method in ['PUT', 'PATCH']:
            if hasattr(agendamento, 'avaliacao'):
                raise serializers.ValidationError({'agendamento': 'Este agendamento já foi avaliado.'})

        serializer.save(cliente=perfil, estabelecimento=agendamento.estabelecimento)

    def perform_update(self, serializer):
        user = self.request.user
        perfil, _ = PerfilUsuario.objects.get_or_create(user=user)
        serializer.save(cliente=perfil)