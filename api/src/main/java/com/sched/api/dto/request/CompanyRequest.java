package com.sched.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(

        @NotBlank(message = "Name cannot be empty")
        String name,

        @NotBlank(message = "CNPJ cannot be empty")
        String cnpj,

        @NotBlank(message = "Email cannot be empty")
        @Email(message = "Invalid email format")
        String emailADMIN,

        @NotBlank(message = "Password cannot be empty")
        String passwordADMIN
) {}
