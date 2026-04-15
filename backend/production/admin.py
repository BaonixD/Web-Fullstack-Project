from django.contrib import admin
from .models import User, Order, NewsPost, InterviewRequest

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'customer', 'executor', 'status', 'created_at')
    list_filter = ('status', 'service_type')
    search_fields = ('title', 'description')

@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at')

@admin.register(InterviewRequest)
class InterviewRequestAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'status', 'created_at')