package com.sched.api.services;

import com.sched.api.domain.*;
import com.sched.api.dto.*;
import com.sched.api.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(CompanyRepository companyRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CompanyResponse registerCompany(CompanyRequest dto) {
        Company company = new Company(null, dto.name(), dto.cnpj());
        company = companyRepository.save(company);

        User admin = new User();
        admin.setName("Admin " + company.getName());
        admin.setEmail("admin@" + company.getName().toLowerCase().replaceAll("\\s+", "") + ".com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setCompany(company);
        userRepository.save(admin);

        return new CompanyResponse(company.getId(), company.getName(), company.getCnpj());
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
        return new UserResponse(newUser.getId(), newUser.getName(), newUser.getEmail(), newUser.getRole(), newUser.getCompany().getId());
    }
}