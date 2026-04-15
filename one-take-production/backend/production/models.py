from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. Кастомная модель пользователя
class User(AbstractUser):
    ROLE_CHOICES = (
        ('guest', 'Гость'),
        ('member', 'Мембер'),
        ('methodist', 'Методист'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    department = models.CharField(max_length=100, blank=True, null=True)

# 2. Модель Заказа (Та самая, которую он не может найти!)
class Order(models.Model):
    SERVICE_CHOICES = (
        ('photo', 'Фотосессия'),
        ('video', 'Видеосъемка'),
        ('design', 'Дизайн'),
    )
    title = models.CharField(max_length=255, verbose_name="Название проекта")
    description = models.TextField(verbose_name="Техническое задание")
    service_type = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    
    # Привязка к пользователям
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_orders')
    executor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Заказ #{self.id}: {self.title}"

# 3. Модель Новостей
class NewsPost(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# 4. Заявка на вступление (Интервью)
class InterviewRequest(models.Model):
    applicant = models.ForeignKey(User, on_delete=models.CASCADE)
    portfolio_link = models.URLField()
    status = models.CharField(max_length=20, default='new')
    created_at = models.DateTimeField(auto_now_add=True)