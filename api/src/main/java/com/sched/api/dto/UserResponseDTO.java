package com.sched.api.dto;

public record UserResponseDTO(
        Long id,
        String name,
        String email,
        Long companyId
) {}