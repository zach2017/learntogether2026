package com.example.modulithdemo.orders;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/{id}")
    public String placeOrder(@PathVariable("id") Long id) {
        orderService.placeOrder(id);
        return "Order " + id + " placed successfully";
    }
}
