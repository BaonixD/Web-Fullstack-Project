from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.utils import timezone

from .models import User, Order, NewsPost, NewsMedia, InterviewRequest, ChatMessage, Notification, OrderStatusLog
from .serializers import (
    OrderSerializer, NewsPostSerializer, UserRegistrationSerializer, UserSerializer,
    InterviewRequestSerializer, ChatMessageSerializer, NotificationSerializer,
    OrderStatusLogSerializer,
)


# ============ HELPERS ============

def _notify(user, kind, text, link=''):
    if not user:
        return
    Notification.objects.create(user=user, kind=kind, text=text, link=link)


def _order_stakeholders(order, exclude=None):
    """Everyone who cares about this order: customer, executor, all methodists.

    `exclude` is typically the actor (sender / status-changer) to avoid self-notification.
    """
    recipients = set()
    if order.customer_id:
        recipients.add(order.customer)
    if order.executor_id:
        recipients.add(order.executor)
    recipients.update(User.objects.filter(role='methodist'))
    recipients.discard(None)
    if exclude is not None:
        recipients.discard(exclude)
    return recipients


# ============ AUTH ============

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_fbv(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_fbv(request):
    from django.contrib.auth import authenticate
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    if '@' in username:
        try:
            user_obj = User.objects.get(email=username)
            username = user_obj.username
        except User.DoesNotExist:
            return Response({'error': 'Неверный логин или пароль'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
    return Response({'error': 'Неверный логин или пароль'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def current_user_fbv(request):
    if request.method == 'PATCH':
        if 'avatar' in request.FILES:
            request.user.avatar = request.FILES['avatar']
            request.user.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)
    return Response(UserSerializer(request.user, context={'request': request}).data)


# ============ NEWS ============

def _attach_media(post, files):
    """Create NewsMedia rows from an iterable of UploadedFile objects."""
    for idx, f in enumerate(files):
        ctype = (getattr(f, 'content_type', '') or '').lower()
        kind = 'video' if ctype.startswith('video/') else 'image'
        NewsMedia.objects.create(post=post, file=f, kind=kind, order=idx)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def news_list_fbv(request):
    if request.method == 'GET':
        news = NewsPost.objects.all().order_by('-created_at')
        return Response(NewsPostSerializer(news, many=True, context={'request': request}).data)

    if request.user.role != 'methodist':
        return Response({'error': 'Только методист может публиковать новости'}, status=status.HTTP_403_FORBIDDEN)

    serializer = NewsPostSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save(author=request.user)
        files = request.FILES.getlist('media')
        _attach_media(post, files)
        return Response(
            NewsPostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def news_detail_fbv(request, pk):
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)
    try:
        news = NewsPost.objects.get(pk=pk)
    except NewsPost.DoesNotExist:
        return Response({'error': 'Новость не найдена'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = NewsPostSerializer(news, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save(author=news.author)
        # Optional: replace media if a new batch is uploaded, and/or remove by id
        remove_ids = request.data.getlist('remove_media') if hasattr(request.data, 'getlist') else []
        if remove_ids:
            NewsMedia.objects.filter(post=news, id__in=remove_ids).delete()
        new_files = request.FILES.getlist('media') if hasattr(request.FILES, 'getlist') else []
        if new_files:
            existing_count = news.media.count()
            for idx, f in enumerate(new_files):
                ctype = (getattr(f, 'content_type', '') or '').lower()
                kind = 'video' if ctype.startswith('video/') else 'image'
                NewsMedia.objects.create(post=news, file=f, kind=kind, order=existing_count + idx)
        return Response(NewsPostSerializer(news, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ ORDERS ============

def can_access_order(order, user):
    return (
        user.role == 'methodist'
        or order.customer_id == user.id
        or order.executor_id == user.id
    )


class OrderListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if request.user.role == 'methodist':
            orders = Order.objects.all().order_by('-created_at')
        else:
            orders = Order.objects.filter(
                Q(customer=request.user) | Q(executor=request.user)
            ).distinct().order_by('-created_at')
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(customer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk, user):
        try:
            order = Order.objects.get(pk=pk)
            if not can_access_order(order, user):
                return None
            return order
        except Order.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order, context={'request': request}).data)

    def put(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)

        restricted = {'status', 'executor'}
        if request.user.role != 'methodist' and any(f in request.data for f in restricted):
            return Response({'error': 'Только методист может назначать исполнителя и менять статус'},
                            status=status.HTTP_403_FORBIDDEN)

        prev_status = order.status
        prev_executor_id = order.executor_id

        serializer = OrderSerializer(order, data=request.data, partial=True, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        order.refresh_from_db()

        # Log status changes + update timestamps + notify
        if 'status' in request.data and prev_status != order.status:
            OrderStatusLog.objects.create(
                order=order, actor=request.user,
                from_status=prev_status, to_status=order.status,
            )
            if order.status == 'in_progress' and not order.started_at:
                order.started_at = timezone.now()
                order.save(update_fields=['started_at'])
            if order.status == 'done' and not order.finished_at:
                order.finished_at = timezone.now()
                order.save(update_fields=['finished_at'])
            # Notify every stakeholder (customer + executor + all methodists) except the actor
            link = f'/order-detail/{order.id}'
            text = f'Статус заказа «{order.title}» изменён на «{order.status}»'
            for u in _order_stakeholders(order, exclude=request.user):
                _notify(u, 'order_status', text, link)

        if 'executor' in request.data and prev_executor_id != order.executor_id and order.executor:
            _notify(order.executor, 'order_assigned',
                    f'Вас назначили исполнителем заказа «{order.title}»',
                    f'/order-detail/{order.id}')

        return Response(OrderSerializer(order, context={'request': request}).data)

    def delete(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if order.customer != request.user and request.user.role != 'methodist':
            return Response({'error': 'Нет прав на удаление'}, status=status.HTTP_403_FORBIDDEN)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def order_messages_fbv(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)
    if not can_access_order(order, request.user):
        return Response({'error': 'Нет доступа к чату'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'POST':
        text = (request.data.get('text') or '').strip()
        attachment = request.FILES.get('attachment')
        if not text and not attachment:
            return Response({'error': 'Пустое сообщение'}, status=status.HTTP_400_BAD_REQUEST)
        msg = ChatMessage.objects.create(
            order=order, sender=request.user, text=text, attachment=attachment,
        )
        # Notify every stakeholder (customer + executor + all methodists) except sender
        link = f'/order-detail/{order.id}'
        for u in _order_stakeholders(order, exclude=request.user):
            _notify(u, 'order_message', f'Новое сообщение в заказе «{order.title}»', link)
        return Response(ChatMessageSerializer(msg, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)

    messages = ChatMessage.objects.filter(order=order).select_related('sender')
    return Response(ChatMessageSerializer(messages, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_status_log_fbv(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)
    if not can_access_order(order, request.user):
        return Response({'error': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)
    logs = order.status_log.all()
    return Response(OrderStatusLogSerializer(logs, many=True).data)


# ============ MEMBERS ============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def members_list_fbv(request):
    members = User.objects.filter(role='member')
    return Response(UserSerializer(members, many=True, context={'request': request}).data)


@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def member_detail_fbv(request, pk):
    try:
        member = User.objects.get(pk=pk, role='member')
    except User.DoesNotExist:
        return Response({'error': 'Мембер не найден'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        if request.user.role != 'methodist':
            return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)
        member.role = 'guest'
        member.department = None
        member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    assigned_orders = Order.objects.filter(executor=member).order_by('-created_at')
    active = assigned_orders.exclude(status='done').count()
    completed = assigned_orders.filter(status='done').count()

    if request.user.role == 'methodist':
        visible = assigned_orders
    else:
        visible = assigned_orders.filter(
            Q(customer=request.user) | Q(executor=request.user)
        ).distinct()

    data = UserSerializer(member, context={'request': request}).data
    data['active_orders'] = active
    data['completed_orders'] = completed
    data['orders'] = OrderSerializer(visible, many=True, context={'request': request}).data
    return Response(data)


# ============ INTERVIEWS ============

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def interview_list_create_fbv(request):
    if request.method == 'POST':
        if request.user.role == 'member':
            return Response({'error': 'Вы уже состоите в команде'}, status=status.HTTP_400_BAD_REQUEST)
        existing = InterviewRequest.objects.filter(applicant=request.user, status='new').first()
        if existing:
            return Response(InterviewRequestSerializer(existing).data, status=status.HTTP_200_OK)

        serializer = InterviewRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(applicant=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET: methodist sees all; applicant can see own
    if request.user.role == 'methodist':
        qs = InterviewRequest.objects.all().order_by('-created_at')
    else:
        qs = InterviewRequest.objects.filter(applicant=request.user).order_by('-created_at')
    return Response(InterviewRequestSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def interview_approve_fbv(request, pk):
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)
    try:
        ir = InterviewRequest.objects.get(pk=pk)
    except InterviewRequest.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)
    if ir.status != 'new':
        return Response({'error': 'Заявка уже обработана'}, status=status.HTTP_400_BAD_REQUEST)
    ir.status = 'approved'
    ir.feedback = (request.data.get('feedback') or '').strip()
    ir.save()

    applicant = ir.applicant
    applicant.role = 'member'
    department = request.data.get('department')
    if department:
        applicant.department = department
    applicant.save()

    _notify(applicant, 'interview_approved',
            'Ваша заявка одобрена! Добро пожаловать в команду.',
            '/profile')
    return Response(InterviewRequestSerializer(ir).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def interview_reject_fbv(request, pk):
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)
    try:
        ir = InterviewRequest.objects.get(pk=pk)
    except InterviewRequest.DoesNotExist:
        return Response({'error': 'Заявка не найдена'}, status=status.HTTP_404_NOT_FOUND)
    if ir.status != 'new':
        return Response({'error': 'Заявка уже обработана'}, status=status.HTTP_400_BAD_REQUEST)
    ir.status = 'rejected'
    ir.feedback = (request.data.get('feedback') or '').strip()
    ir.save()

    _notify(ir.applicant, 'interview_rejected',
            'Ваша заявка отклонена. Посмотрите комментарий методиста.',
            '/profile')
    return Response(InterviewRequestSerializer(ir).data)


# ============ NOTIFICATIONS ============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notifications_list_fbv(request):
    qs = Notification.objects.filter(user=request.user)[:50]
    data = NotificationSerializer(qs, many=True).data
    unread = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'notifications': data, 'unread': unread})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def notifications_mark_read_fbv(request, pk):
    try:
        n = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    n.is_read = True
    n.save(update_fields=['is_read'])
    return Response(NotificationSerializer(n).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def notifications_mark_all_read_fbv(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})
