package com.sched.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequestDTO(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "CNPJ is required") String cnpj
) {}