import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import ChatMessage, Order


class OrderChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_chat_{self.order_id}'
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return
        if not await self.can_access_order():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            return

        text = (payload.get('text') or '').strip()
        if not text:
            return
        message = await self.save_message(text[:2000])

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def can_access_order(self):
        try:
            order = Order.objects.get(pk=self.order_id)
        except Order.DoesNotExist:
            return False
        return (
            self.user.role == 'methodist'
            or order.customer_id == self.user.id
            or order.executor_id == self.user.id
        )

    @database_sync_to_async
    def save_message(self, text):
        message = ChatMessage.objects.create(
            order_id=self.order_id,
            sender=self.user,
            text=text,
        )
        return {
            'id': message.id,
            'order': int(self.order_id),
            'sender': self.user.id,
            'sender_name': self.user.username,
            'sender_role': self.user.role,
            'text': message.text,
            'created_at': message.created_at.isoformat(),
        }
