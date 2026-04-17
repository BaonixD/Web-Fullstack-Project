from django.urls import path
from .views import (
    login_fbv,
    register_fbv,
    news_list_fbv,
    news_detail_fbv,
    current_user_fbv,
    members_list_fbv,
    member_remove_fbv,
    interview_list_create_fbv,
    interview_approve_fbv,
    interview_reject_fbv,
    order_messages_fbv,
    OrderListCreateAPIView,
    OrderDetailAPIView,
)

urlpatterns = [
    path('login/', login_fbv, name='login'),
    path('register/', register_fbv, name='register'),
    path('news/', news_list_fbv, name='news-list'),
    path('news/<int:pk>/', news_detail_fbv, name='news-detail'),
    path('me/', current_user_fbv, name='current-user'),
    path('members/', members_list_fbv, name='members-list'),
    path('members/<int:pk>/', member_remove_fbv, name='member-remove'),
    path('interviews/', interview_list_create_fbv, name='interview-list-create'),
    path('interviews/<int:pk>/approve/', interview_approve_fbv, name='interview-approve'),
    path('interviews/<int:pk>/reject/', interview_reject_fbv, name='interview-reject'),
    path('orders/', OrderListCreateAPIView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail'),
    path('orders/<int:pk>/messages/', order_messages_fbv, name='order-messages'),
]
