from django.urls import path
from .views import (
    news_list_fbv, 
    current_user_fbv, 
    OrderListCreateAPIView, 
    OrderDetailAPIView
)

urlpatterns = [
    # Пути для функций (FBV)
    path('news/', news_list_fbv, name='news-list'),
    path('me/', current_user_fbv, name='current-user'),
    
    # Пути для классов (CBV)
    path('orders/', OrderListCreateAPIView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail'),
]