package com.sched.api.controller;

import com.sched.api.domain.User;
import com.sched.api.dto.request.CompanyRequest;
import com.sched.api.dto.request.LoginRequest;
import com.sched.api.dto.request.UserRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.dto.response.LoginResponse;
import com.sched.api.dto.response.UserResponse;
import com.sched.api.service.AuthService;
import com.sched.api.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

//mudei essa parte
@CrossOrigin(origins = "http://127.0.0.1:5500", allowedHeaders = "*")
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
    public ResponseEntity<CompanyResponse> registerCompany(@Valid @RequestBody CompanyRequest dto) {
        return ResponseEntity.ok(authService.registerCompany(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest dto) {
        var authToken = new UsernamePasswordAuthenticationToken(dto.email(), dto.password());
        var auth = authenticationManager.authenticate(authToken);
        var token = tokenService.generateToken((User) auth.getPrincipal());

        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/user")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRequest dto, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(authService.registerUser(dto, admin));
    }
}