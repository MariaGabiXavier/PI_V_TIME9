package com.sched.api.dto.response;

import com.sched.api.domain.Role;
import com.sched.api.domain.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        Long companyId,
        LocalDateTime createdAt
) {
    public UserResponse(User user) {
        this(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompany().getId(),
                user.getCreatedAt()
        );
    }
}