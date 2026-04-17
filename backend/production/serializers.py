from rest_framework import serializers
from .models import User, Order, NewsPost, InterviewRequest, ChatMessage


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department']


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    executor_name = serializers.ReadOnlyField(source='executor.username', default=None)

    class Meta:
        model = Order
        fields = ['id', 'title', 'description', 'service_type', 'status',
                  'customer', 'customer_name', 'executor', 'executor_name', 'created_at']
        read_only_fields = ['customer', 'created_at']


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_role = serializers.ReadOnlyField(source='author.role')

    class Meta:
        model = NewsPost
        fields = ['id', 'title', 'content', 'author', 'author_name', 'author_role', 'created_at']
        read_only_fields = ['author', 'created_at']


class InterviewRequestSerializer(serializers.ModelSerializer):
    applicant_name = serializers.ReadOnlyField(source='applicant.username')
    applicant_email = serializers.ReadOnlyField(source='applicant.email')
    applicant_full_name = serializers.SerializerMethodField()

    class Meta:
        model = InterviewRequest
        fields = [
            'id', 'applicant', 'applicant_name', 'applicant_email', 'applicant_full_name',
            'portfolio_link', 'status', 'created_at',
        ]
        read_only_fields = ['applicant', 'status', 'created_at']

    def get_applicant_full_name(self, obj):
        full_name = f'{obj.applicant.first_name} {obj.applicant.last_name}'.strip()
        return full_name or obj.applicant.username


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    sender_role = serializers.ReadOnlyField(source='sender.role')

    class Meta:
        model = ChatMessage
        fields = ['id', 'order', 'sender', 'sender_name', 'sender_role', 'text', 'created_at']
        read_only_fields = ['order', 'sender', 'created_at']


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ContactFormSerializer(serializers.Serializer):
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=100)
    message = serializers.CharField()
