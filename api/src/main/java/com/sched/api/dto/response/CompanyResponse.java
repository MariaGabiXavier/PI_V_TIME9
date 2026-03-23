package com.sched.api.dto.response;

import java.time.LocalDateTime;

public record CompanyResponse(
        Long id,
        String name,
        String cnpj,
        LocalDateTime createdAt
) {}