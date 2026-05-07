package com.sched.api.service;

import com.sched.api.dto.response.AlertResponse;
import com.sched.api.repository.AlertRepository;
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
    public List<AlertResponse> getAll() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next30Days = now.plusDays(30);

        return alertRepository
                .findByExpirationDateBetween(now, next30Days)
                .stream()
                .map(AlertResponse::new)
                .toList();
    }
}