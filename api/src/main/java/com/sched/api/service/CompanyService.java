package com.sched.api.service;

import com.sched.api.dto.CompanyRequestDTO;
import com.sched.api.dto.CompanyResponseDTO;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.model.Company;
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

    @Transactional
    public CompanyResponseDTO create(CompanyRequestDTO dto) {
        if (companyRepository.existsByCnpj(dto.cnpj())) {
            throw new IllegalArgumentException("CNPJ already in use");
        }
        Company company = new Company();
        company.setName(dto.name());
        company.setCnpj(dto.cnpj());

        Company saved = companyRepository.save(company);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponseDTO> getAll() {
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponseDTO getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return mapToResponse(company);
    }

    @Transactional
    public CompanyResponseDTO update(Long id, CompanyRequestDTO dto) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        company.setName(dto.name());
        company.setCnpj(dto.cnpj());
        return mapToResponse(companyRepository.save(company));
    }

    @Transactional
    public void delete(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }

    private CompanyResponseDTO mapToResponse(Company company) {
        return new CompanyResponseDTO(company.getId(), company.getName(), company.getCnpj(), company.getCreatedAt());
    }
}