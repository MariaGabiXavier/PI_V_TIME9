package com.sched.api.repository;

import com.sched.api.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findAllByDeletedFalse();
    Optional<Company> findByIdAndDeletedFalse(Long id);
}
