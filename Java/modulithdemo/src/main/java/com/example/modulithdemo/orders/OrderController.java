package com.example.modulithdemo.orders;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/orders")
@Tag(name = "Orders", description = "Operations related to orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Option 1: POST to create a new order (proper RESTful approach)
    @PostMapping
    @Operation(
        summary = "Create a new order",
        description = "Creates a new order and returns a confirmation message."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Order created successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid order data", content = @Content),
        @ApiResponse(responseCode = "500", description = "Server error", content = @Content)
    })
    public ResponseEntity<OrderResponse> createOrder(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Order details", required = true)
        @RequestBody OrderRequest orderRequest
    ) {
        Long orderId = orderService.createOrder(orderRequest);
        OrderResponse response = new OrderResponse(orderId, "Order placed successfully");
        return ResponseEntity.status(201).body(response);
    }

    // Option 2: PUT/PATCH to update order status (if you need to "place" an existing order)
    @PatchMapping("/{id}/place")
    @Operation(
        summary = "Place an existing order",
        description = "Marks an existing order as placed and returns a confirmation message."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order placed successfully",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found", content = @Content),
        @ApiResponse(responseCode = "400", description = "Invalid order ID supplied", content = @Content),
        @ApiResponse(responseCode = "500", description = "Server error", content = @Content)
    })
    public ResponseEntity<OrderResponse> placeOrder(
        @Parameter(description = "Order ID to place", required = true, example = "123")
        @PathVariable("id") Long id
    ) {
        orderService.placeOrder(id);
        OrderResponse response = new OrderResponse(id, "Order " + id + " placed successfully");
        return ResponseEntity.ok(response);
    }

    // Option 3: GET to retrieve order details
    @GetMapping("/{id}")
    @Operation(
        summary = "Get order by ID",
        description = "Retrieves order details for the given order ID."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Order found",
            content = @Content(schema = @Schema(implementation = OrderResponse.class))),
        @ApiResponse(responseCode = "404", description = "Order not found", content = @Content)
    })
    public ResponseEntity<OrderResponse> getOrder(
        @Parameter(description = "Order ID", required = true, example = "123")
        @PathVariable("id") Long id
    ) {
        OrderResponse order = orderService.getOrder(id);
        return ResponseEntity.ok(order);
    }
}

// OrderRequest DTO
class OrderRequest {
    @Schema(description = "Customer ID", example = "456", required = true)
    private Long customerId;
    
    @Schema(description = "Product ID", example = "789", required = true)
    private Long productId;
    
    @Schema(description = "Quantity", example = "2", required = true)
    private Integer quantity;

    // Constructors
    public OrderRequest() {}
    
    public OrderRequest(Long customerId, Long productId, Integer quantity) {
        this.customerId = customerId;
        this.productId = productId;
        this.quantity = quantity;
    }

    // Getters and Setters
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}

// OrderResponse DTO
class OrderResponse {
    @Schema(description = "Order ID", example = "123")
    private Long orderId;
    
    @Schema(description = "Status message", example = "Order placed successfully")
    private String message;

    // Constructors
    public OrderResponse() {}
    
    public OrderResponse(Long orderId, String message) {
        this.orderId = orderId;
        this.message = message;
    }

    // Getters and Setters
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}