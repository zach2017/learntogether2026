package com.example.modulithdemo.notifications;

import com.example.modulithdemo.common.OrderPlacedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @EventListener
    public void sendNotification(OrderPlacedEvent event) {
        System.out.println("[NOTIFICATIONS] Email sent for order: " + event.orderId());
    }
}
