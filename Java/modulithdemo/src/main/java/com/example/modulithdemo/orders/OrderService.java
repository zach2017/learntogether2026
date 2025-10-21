package com.example.modulithdemo.orders;

import com.example.modulithdemo.common.OrderPlacedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;

    public OrderService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void placeOrder(Long orderId) {
        System.out.println("[ORDERS] Placing order: " + orderId);
        publisher.publishEvent(new OrderPlacedEvent(orderId));
    }

    public Long createOrder(OrderRequest orderRequest) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'createOrder'");
    }

    public OrderResponse getOrder(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getOrder'");
    }
}
