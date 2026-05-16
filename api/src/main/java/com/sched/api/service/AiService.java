package com.sched.api.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sched.api.domain.Sale;
import com.sched.api.domain.Stock;
import com.sched.api.dto.response.DemandDataResponse;
import com.sched.api.repository.SaleRepository;
import com.sched.api.repository.StockRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiService {

    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;

    public List<DemandDataResponse> getDemandData() {

        List<Sale> sales = saleRepository.findAll();

        return sales.stream().map(sale -> {

            Integer stockQuantity = stockRepository
                    .findByProductId(sale.getProduct().getId())
                    .stream()
                    .mapToInt(Stock::getQuantity)
                    .sum();

            return new DemandDataResponse(
                    sale.getProduct().getName(),
                    sale.getProduct().getCategory(),
                    sale.getProduct().getPrice(),
                    sale.getTotalSold(),
                    sale.getSaleDate().getMonthValue(),
                    stockQuantity
            );

        }).toList();
    }
}