package com.example.modulithdemo.inventory;

import com.example.modulithdemo.common.OrderPlacedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        System.out.println("[INVENTORY] Reducing stock for order: " + event.orderId());
    }
}
