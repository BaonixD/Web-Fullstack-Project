from django.urls import path
from .views import (
    login_fbv,
    register_fbv,
    news_list_fbv,
    current_user_fbv,
    members_list_fbv,
    OrderListCreateAPIView,
    OrderDetailAPIView,
)

urlpatterns = [
    path('login/', login_fbv, name='login'),
    path('register/', register_fbv, name='register'),
    path('news/', news_list_fbv, name='news-list'),
    path('me/', current_user_fbv, name='current-user'),
    path('members/', members_list_fbv, name='members-list'),
    path('orders/', OrderListCreateAPIView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail'),
]
