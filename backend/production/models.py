from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('guest', 'Гость'),
        ('member', 'Мембер'),
        ('methodist', 'Методист'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    department = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

class Order(models.Model):
    SERVICE_CHOICES = (
        ('photo', 'Фотосессия'),
        ('video', 'Видеосъемка'),
        ('design', 'Дизайн'),
    )
    title = models.CharField(max_length=255, verbose_name="Название проекта")
    description = models.TextField(verbose_name="Техническое задание")
    service_type = models.CharField(max_length=20, choices=SERVICE_CHOICES)

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_orders')
    executor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')

    status = models.CharField(max_length=50, default='pending')
    cover_image = models.ImageField(upload_to='order_covers/', blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Заказ #{self.id}: {self.title}"


class OrderStatusLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_log')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='+')
    from_status = models.CharField(max_length=50, blank=True)
    to_status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class NewsPost(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class NewsMedia(models.Model):
    KIND_CHOICES = (
        ('image', 'Изображение'),
        ('video', 'Видео'),
    )
    post = models.ForeignKey(NewsPost, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to='news/')
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='image')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']


class InterviewRequest(models.Model):
    STATUS_CHOICES = (
        ('new', 'Новая'),
        ('approved', 'Одобрена'),
        ('rejected', 'Отклонена'),
    )
    applicant = models.ForeignKey(User, on_delete=models.CASCADE)
    portfolio_link = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    feedback = models.TextField(blank=True, default='', help_text='Комментарий методиста')
    created_at = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    text = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='chat/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Order #{self.order_id} message by {self.sender}'


class Notification(models.Model):
    KIND_CHOICES = (
        ('interview_approved', 'Заявка одобрена'),
        ('interview_rejected', 'Заявка отклонена'),
        ('order_assigned', 'Заказ назначен'),
        ('order_status', 'Смена статуса заказа'),
        ('order_message', 'Сообщение в заказе'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    kind = models.CharField(max_length=40, choices=KIND_CHOICES)
    text = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
