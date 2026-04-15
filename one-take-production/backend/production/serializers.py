from rest_framework import serializers
from .models import User, Order, NewsPost

# --- 1. ModelSerializer (Автоматические, для CRUD) ---

class OrderSerializer(serializers.ModelSerializer):
    # Показываем имя заказчика, а не просто его ID
    customer_name = serializers.ReadOnlyField(source='customer.username')

    class Meta:
        model = Order
        fields = '__all__' # Берем все поля: id, title, description, status и т.д.

class NewsPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsPost
        fields = ['id', 'title', 'content', 'created_at']


# --- 2. Serializer (Ручные, для спец. задач по регламенту) ---

class UserLoginSerializer(serializers.Serializer):
    """Нужен для обработки входа в систему"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class ContactFormSerializer(serializers.Serializer):
    """Нужен для отправки сообщений в поддержку без записи в базу"""
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=100)
    message = serializers.CharField()