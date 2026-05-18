package com.sched.api.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.sched.api.domain.Sale;
import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.response.AiPredictionResponse;
import com.sched.api.repository.SaleRepository;
import com.sched.api.repository.StockRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiService {

    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;
    private final RestTemplate restTemplate;

    public List<AiPredictionResponse> getPredictions(User user) {

        Long companyId = user.getCompany().getId();

        List<Sale> sales =
                saleRepository.findByProduct_Company_Id(companyId);

        List<AiPredictionResponse> predictions =
                new ArrayList<>();

        for (Sale sale : sales) {

            Long stockQuantity = stockRepository
                    .findByProductId(sale.getProduct().getId())
                    .stream()
                    .mapToLong(Stock::getQuantity)
                    .sum();

            long historyCount = sales.stream()
                    .filter(s -> s.getProduct().getId()
                            .equals(sale.getProduct().getId()))
                    .count();

            Map<String, Object> request =
                    new HashMap<>();

            request.put(
                    "month",
                    sale.getSaleDate().getMonthValue()
            );

            request.put(
                    "price",
                    sale.getProduct().getPrice()
            );

            request.put(
                    "stockQuantity",
                    stockQuantity
            );

            request.put(
                    "historyCount",
                    historyCount
            );

            AiPredictionResponse response =
                    restTemplate.postForObject(
                            "http://127.0.0.1:5000/predict",
                            request,
                            AiPredictionResponse.class
                    );

            if (response != null) {

                response.setProductName(
                        sale.getProduct().getName()
                );

                predictions.add(response);
            }
        }

        return predictions;
    }
}