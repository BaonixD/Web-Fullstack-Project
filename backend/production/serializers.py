from rest_framework import serializers
from .models import User, Order, NewsPost


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')

    class Meta:
        model = Order
        fields = '__all__' 

class NewsPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsPost
        fields = ['id', 'title', 'content', 'created_at']



class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class ContactFormSerializer(serializers.Serializer):
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=100)
    message = serializers.CharField()