package com.sched.api.dto.response;

import com.sched.api.domain.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        Long companyId,
        LocalDateTime createdAt
) {}