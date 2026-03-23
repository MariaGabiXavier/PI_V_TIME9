package com.sched.api.service;

import com.sched.api.domain.*;
import com.sched.api.dto.request.CompanyRequest;
import com.sched.api.dto.request.UserRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.dto.response.UserResponse;
import com.sched.api.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CompanyResponse registerCompany(CompanyRequest dto) {
        Company company = new Company(null, dto.name(), dto.cnpj(), false, null);
        company = companyRepository.save(company);

        User admin = new User();
        admin.setName("ADMIN " + company.getName());
        admin.setEmail(dto.emailADMIN());
        admin.setPassword(passwordEncoder.encode(dto.passwordADMIN()));
        admin.setRole(Role.ADMIN);
        admin.setCompany(company);
        userRepository.save(admin);

        return new CompanyResponse(company.getId(), company.getName(), company.getCnpj(), company.getCreatedAt());
    }

    @Transactional
    public UserResponse registerUser(UserRequest dto, User authenticatedAdmin) {
        User newUser = new User();
        newUser.setName(dto.name());
        newUser.setEmail(dto.email());
        newUser.setPassword(passwordEncoder.encode(dto.password()));
        newUser.setRole(dto.role());
        newUser.setCompany(authenticatedAdmin.getCompany());

        userRepository.save(newUser);
        return new UserResponse(
                newUser.getId(),
                newUser.getName(),
                newUser.getEmail(),
                newUser.getRole(),
                newUser.getCompany().getId(),
                newUser.getCreatedAt()
        );
    }
}
