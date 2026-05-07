package com.sched.api.exception;

public class ProductHasStockException extends RuntimeException {

    public ProductHasStockException(Long productId) {
        super("Product cannot be deleted because it still has stock quantity available. Product id: " + productId);
    }
}