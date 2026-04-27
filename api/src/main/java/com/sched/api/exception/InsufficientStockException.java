package com.sched.api.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException() {
        super("Insufficient stock.");
    }

    public InsufficientStockException(String message) {
        super(message);
    }
}