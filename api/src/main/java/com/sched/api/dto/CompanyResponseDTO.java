package com.sched.api.dto;

import java.time.LocalDateTime;

public record CompanyResponseDTO(
        Long id,
        String name,
        String cnpj,
        LocalDateTime createdAt
) {}