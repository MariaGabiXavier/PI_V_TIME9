package com.sched.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProductRequest(
        @NotBlank(message = "Name cannot be empty")
        String name,

        @NotBlank(message = "Category cannot be empty")
        String category,

        @NotNull(message = "price cannot be empty")
        Double price,

        @NotBlank(message = "unitOfMeasure cannot be empty")
        String unitOfMeasure,

        @NotNull(message = "isPerishable cannot be empty")
        Boolean isPerishable
) {}