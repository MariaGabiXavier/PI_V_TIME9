package com.sched.api.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record StockRequest (
    @NotNull(message = "quantity cannot be empty")
    Integer quantity,

    @NotNull(message = "expirationDate cannot be empty")
    LocalDateTime expirationDate
) { }
