package com.sched.api.service;

import com.sched.api.domain.Company;
import com.sched.api.dto.request.CompanyRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAll() {
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        return mapToResponse(company);
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyRequest dto) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        company.setName(dto.name());
        company.setCnpj(dto.cnpj());

        return mapToResponse(companyRepository.save(company));
    }

    @Transactional
    public void delete(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        company.setDeleted(true);

        companyRepository.save(company);
    }

    private CompanyResponse mapToResponse(Company company) {
        return new CompanyResponse(company.getId(), company.getName(), company.getCnpj(), company.getCreatedAt());
    }
}