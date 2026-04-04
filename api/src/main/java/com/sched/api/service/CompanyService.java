package com.sched.api.service;

import com.sched.api.domain.Company;
import com.sched.api.domain.User;
import com.sched.api.dto.request.CompanyRequest;
import com.sched.api.dto.request.CompanyUpdateRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.CompanyRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAll() {
        return companyRepository.findAllByDeletedFalse().stream()
                .map(CompanyResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(Long id) {
        Company company = findActiveCompanyOrThrow(id);
        return new CompanyResponse(company);
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyUpdateRequest dto) {
        User authUser = SecurityUtils.getAuthenticatedUser();
        Company company = findActiveCompanyOrThrow(id);

        validateCompanyAccess(authUser, company);

        company.setName(dto.name());
        company.setCnpj(dto.cnpj());

        return new CompanyResponse(companyRepository.save(company));
    }

    @Transactional
    public void delete(Long id) {
        User authUser = SecurityUtils.getAuthenticatedUser();
        Company company = findActiveCompanyOrThrow(id);

        validateCompanyAccess(authUser, company);

        company.setDeleted(true);

        companyRepository.save(company);
    }

    private Company findActiveCompanyOrThrow(Long id) {
        return companyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found or inactive with id: " + id));
    }

    private void validateCompanyAccess(User authUser, Company targetCompany) {
        if (!authUser.getCompany().getId().equals(targetCompany.getId())) {
            throw new AccessDeniedException("You do not have permission to access another company's data.");
        }
    }
}