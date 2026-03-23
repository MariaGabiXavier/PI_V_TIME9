package com.sched.api.dto;

import com.sched.api.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequest(@NotBlank String name, @Email String email, String password, Role role) {}