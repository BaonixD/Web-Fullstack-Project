from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.db.models import Q
from .models import User, Order, NewsPost, InterviewRequest, ChatMessage
from .serializers import (
    OrderSerializer, NewsPostSerializer, UserRegistrationSerializer, UserSerializer,
    InterviewRequestSerializer, ChatMessageSerializer,
)


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

    # Allow login by email
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_fbv(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ============ NEWS ============

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def news_list_fbv(request):
    if request.method == 'GET':
        news = NewsPost.objects.all().order_by('-created_at')
        serializer = NewsPostSerializer(news, many=True)
        return Response(serializer.data)

    # Only methodists may post news
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист может публиковать новости'},
                        status=status.HTTP_403_FORBIDDEN)

    serializer = NewsPostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def news_detail_fbv(request, pk):
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист может управлять новостями'},
                        status=status.HTTP_403_FORBIDDEN)

    try:
        news = NewsPost.objects.get(pk=pk)
    except NewsPost.DoesNotExist:
        return Response({'error': 'Новость не найдена'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = NewsPostSerializer(news, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(author=news.author)
        return Response(serializer.data)
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

    def get(self, request):
        if request.user.role == 'methodist':
            orders = Order.objects.all().order_by('-created_at')
        else:
            orders = Order.objects.filter(
                Q(customer=request.user) | Q(executor=request.user)
            ).distinct().order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(customer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def put(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Only methodist may change status or executor
        restricted = {'status', 'executor'}
        if request.user.role != 'methodist' and any(f in request.data for f in restricted):
            return Response({'error': 'Только методист может назначать исполнителя и менять статус'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = OrderSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        # Customer can delete own order; methodist can delete any
        if order.customer != request.user and request.user.role != 'methodist':
            return Response({'error': 'Нет прав на удаление'}, status=status.HTTP_403_FORBIDDEN)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_messages_fbv(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)
    if not can_access_order(order, request.user):
        return Response({'error': 'Нет доступа к чату'}, status=status.HTTP_403_FORBIDDEN)

    messages = ChatMessage.objects.filter(order=order).select_related('sender')
    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)


# ============ MEMBERS ============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def members_list_fbv(request):
    members = User.objects.filter(role='member')
    serializer = UserSerializer(members, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def member_remove_fbv(request, pk):
    """Methodist demotes a member back to guest."""
    if request.user.role != 'methodist':
        return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)
    try:
        member = User.objects.get(pk=pk, role='member')
    except User.DoesNotExist:
        return Response({'error': 'Мембер не найден'}, status=status.HTTP_404_NOT_FOUND)
    member.role = 'guest'
    member.department = None
    member.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


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

        # Any authenticated user can submit an application
        serializer = InterviewRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(applicant=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.user.role != 'methodist':
        return Response({'error': 'Только методист'}, status=status.HTTP_403_FORBIDDEN)

    requests_qs = InterviewRequest.objects.all().order_by('-created_at')
    serializer = InterviewRequestSerializer(requests_qs, many=True)
    return Response(serializer.data)


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
    ir.save()
    # Promote applicant to member
    applicant = ir.applicant
    applicant.role = 'member'
    department = request.data.get('department')
    if department:
        applicant.department = department
    applicant.save()
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
    ir.save()
    return Response(InterviewRequestSerializer(ir).data)
