from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from .models import User, Order, NewsPost
from .serializers import (
    OrderSerializer, NewsPostSerializer, UserRegistrationSerializer, UserSerializer
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

    serializer = NewsPostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ ORDERS ============

class OrderListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role == 'methodist':
            orders = Order.objects.all().order_by('-created_at')
        else:
            orders = Order.objects.filter(customer=request.user).order_by('-created_at')
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
            if order.customer != user and order.executor != user:
                if user.role != 'methodist':
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
        serializer = OrderSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        order = self.get_object(pk, request.user)
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============ MEMBERS ============

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def members_list_fbv(request):
    members = User.objects.filter(role='member')
    serializer = UserSerializer(members, many=True)
    return Response(serializer.data)
