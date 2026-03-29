package com.sched.api.dto.response;

import com.sched.api.domain.Company;

import java.time.LocalDateTime;

public record CompanyResponse(
        Long id,
        String name,
        String cnpj,
        LocalDateTime createdAt
) {
    public CompanyResponse(Company company) {
        this(
                company.getId(),
                company.getName(),
                company.getCnpj(),
                company.getCreatedAt()
        );
    }
}