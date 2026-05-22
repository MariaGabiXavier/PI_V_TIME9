package com.sched.api.service;

import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.response.AlertResponse;
import com.sched.api.repository.AlertRepository;
import com.sched.api.repository.StockRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final StockRepository stockRepository;

    @Transactional(readOnly = true)
    public List<AlertResponse> getProductsExpiringInNext30Days() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next30Days = now.plusDays(30);

        User authUser = SecurityUtils.getAuthenticatedUser();
        Long companyId = authUser.getCompany().getId();

        return alertRepository
                .findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
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

        List<Stock> allStocks =
                stockRepository.findByProduct_Company_IdAndProduct_DeletedFalse(companyId);

        return allStocks.stream()
                .collect(Collectors.groupingBy(stock -> stock.getProduct().getId()))
                .values()
                .stream()
                .filter(stocks -> stocks.stream()
                        .mapToInt(Stock::getQuantity)
                        .sum() <= 20)
                .map(stocks -> new AlertResponse(stocks.get(0)))
                .toList();
    }
}