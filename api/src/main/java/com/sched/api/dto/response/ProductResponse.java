package com.sched.api.dto.response;

import com.sched.api.domain.Company;
import com.sched.api.domain.Product;

import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String category,
        Double price,
        Boolean isPerishable,
        String unitOfMeasure,
        LocalDateTime createdAt,
        Company company
) {
    public ProductResponse(Product product) {
        this(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getIsPerishable(),
                product.getUnitOfMeasure(),
                product.getCreatedAt(),
                product.getCompany()
        );
    }
}
