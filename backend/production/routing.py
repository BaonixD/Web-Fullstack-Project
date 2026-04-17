from django.urls import path

from .consumers import OrderChatConsumer


websocket_urlpatterns = [
    path('ws/orders/<int:order_id>/chat/', OrderChatConsumer.as_asgi()),
]
