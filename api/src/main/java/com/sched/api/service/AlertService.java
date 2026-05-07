package com.sched.api.service;

import com.sched.api.domain.User;
import com.sched.api.dto.response.AlertResponse;
import com.sched.api.repository.AlertRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    @Transactional(readOnly = true)
    public List<AlertResponse> getProductsExpiringInNext30Days() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next30Days = now.plusDays(30);

        User authUser = SecurityUtils.getAuthenticatedUser();
        Long companyId = authUser.getCompany().getId();

        return alertRepository
                .findByExpirationDateBetweenAndProduct_Company_Id(
                        now,
                        next30Days,
                        companyId
                )
                .stream()
                .map(AlertResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getProductsWithLowStock() {

        User authUser = SecurityUtils.getAuthenticatedUser();
        Long companyId = authUser.getCompany().getId();

        return alertRepository
                .findByQuantityLessThanEqualAndProduct_Company_Id(
                        20,
                        companyId
                )
                .stream()
                .map(AlertResponse::new)
                .toList();
    }
}