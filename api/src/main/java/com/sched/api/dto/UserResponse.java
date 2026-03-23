package com.sched.api.dto;

import com.sched.api.domain.Role;

public record UserResponse(Long id, String name, String email, Role role, Long companyId) {}