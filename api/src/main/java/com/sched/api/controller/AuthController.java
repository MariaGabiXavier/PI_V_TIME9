package com.sched.api.controller;

import com.sched.api.domain.User;
import com.sched.api.dto.*;
import com.sched.api.services.AuthService;
import com.sched.api.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager, TokenService tokenService) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @PostMapping("/company")
    public ResponseEntity<CompanyResponse> registerCompany(@RequestBody CompanyRequest dto) {
        return ResponseEntity.ok(authService.registerCompany(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.email(), dto.password());
        var auth = authenticationManager.authenticate(authToken);
        var token = tokenService.generateToken((User) auth.getPrincipal());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/user")
    public ResponseEntity<UserResponse> registerUser(@RequestBody UserRequest dto, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(authService.registerUser(dto, admin));
    }
}