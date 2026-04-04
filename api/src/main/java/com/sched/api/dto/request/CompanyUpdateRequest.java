package com.sched.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CompanyUpdateRequest (

    @NotBlank(message = "Name cannot be empty")
    String name,

    @NotBlank(message = "CNPJ cannot be empty")
    String cnpj

) {}
