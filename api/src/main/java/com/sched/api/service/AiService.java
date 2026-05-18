package com.sched.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.sched.api.domain.User;
import com.sched.api.dto.response.AiPredictionResponse;
import com.sched.api.dto.response.DemandDataResponse;
import com.sched.api.repository.SaleRepository;
import com.sched.api.repository.StockRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiService {

    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;
    private final RestTemplate restTemplate;

    public List<DemandDataResponse> getDemandData(User user) {

        Long companyId = user.getCompany().getId();

        return saleRepository.getDemandDataByCompany(companyId);
    }

    public List<AiPredictionResponse> getPredictions(User user) {

        List<DemandDataResponse> demandData =
                getDemandData(user);

        String flaskUrl =
                "http://127.0.0.1:5000/predict";

        AiPredictionResponse[] response =
                restTemplate.postForObject(
                        flaskUrl,
                        demandData,
                        AiPredictionResponse[].class
                );

        return List.of(response);
    }
}