from rest_framework import serializers
from .models import User, Order, NewsPost, NewsMedia, InterviewRequest, ChatMessage, Notification, OrderStatusLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'department', 'avatar_url']

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    executor_name = serializers.ReadOnlyField(source='executor.username', default=None)
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'title', 'description', 'service_type', 'status',
                  'customer', 'customer_name', 'executor', 'executor_name',
                  'cover_image', 'cover_url', 'deadline', 'started_at', 'finished_at',
                  'created_at']
        read_only_fields = ['customer', 'created_at', 'started_at', 'finished_at', 'cover_url']
        extra_kwargs = {'cover_image': {'write_only': True, 'required': False}}

    def get_cover_url(self, obj):
        if not obj.cover_image:
            return None
        request = self.context.get('request')
        url = obj.cover_image.url
        return request.build_absolute_uri(url) if request else url


class OrderStatusLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.username')

    class Meta:
        model = OrderStatusLog
        fields = ['id', 'order', 'actor', 'actor_name', 'from_status', 'to_status', 'created_at']


class NewsMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = NewsMedia
        fields = ['id', 'url', 'kind', 'order']

    def get_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_role = serializers.ReadOnlyField(source='author.role')
    media = NewsMediaSerializer(many=True, read_only=True)

    class Meta:
        model = NewsPost
        fields = ['id', 'title', 'content', 'author', 'author_name', 'author_role', 'created_at', 'updated_at', 'media']
        read_only_fields = ['author', 'created_at', 'updated_at']


class InterviewRequestSerializer(serializers.ModelSerializer):
    applicant_name = serializers.ReadOnlyField(source='applicant.username')
    applicant_email = serializers.ReadOnlyField(source='applicant.email')
    applicant_full_name = serializers.SerializerMethodField()

    class Meta:
        model = InterviewRequest
        fields = [
            'id', 'applicant', 'applicant_name', 'applicant_email', 'applicant_full_name',
            'portfolio_link', 'status', 'feedback', 'created_at',
        ]
        read_only_fields = ['applicant', 'status', 'created_at']

    def get_applicant_full_name(self, obj):
        full_name = f'{obj.applicant.first_name} {obj.applicant.last_name}'.strip()
        return full_name or obj.applicant.username


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    sender_role = serializers.ReadOnlyField(source='sender.role')
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'order', 'sender', 'sender_name', 'sender_role', 'text',
                  'attachment', 'attachment_url', 'attachment_name', 'created_at']
        read_only_fields = ['order', 'sender', 'created_at']
        extra_kwargs = {'attachment': {'write_only': True, 'required': False}}

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url

    def get_attachment_name(self, obj):
        if not obj.attachment:
            return None
        return obj.attachment.name.rsplit('/', 1)[-1]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'kind', 'text', 'link', 'is_read', 'created_at']


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ContactFormSerializer(serializers.Serializer):
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=100)
    message = serializers.CharField()
