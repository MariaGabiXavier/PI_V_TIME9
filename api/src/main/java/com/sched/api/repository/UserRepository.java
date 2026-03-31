package com.sched.api.repository;

import com.sched.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findAllByCompanyIdAndDeletedFalse(Long companyId);
    Optional<User> findByIdAndDeletedFalse(Long id);
}
