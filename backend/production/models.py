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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Заказ #{self.id}: {self.title}"

class NewsPost(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class InterviewRequest(models.Model):
    STATUS_CHOICES = (
        ('new', 'Новая'),
        ('approved', 'Одобрена'),
        ('rejected', 'Отклонена'),
    )
    applicant = models.ForeignKey(User, on_delete=models.CASCADE)
    portfolio_link = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Order #{self.order_id} message by {self.sender}'
