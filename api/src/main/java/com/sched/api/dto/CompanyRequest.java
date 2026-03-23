package com.sched.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(@NotBlank String name, @NotBlank String cnpj) {}
