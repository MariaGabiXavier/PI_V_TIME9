package com.sched.api.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.sched.api.domain.User;
import com.sched.api.dto.response.AiPredictionResponse;
import com.sched.api.dto.response.DemandDataResponse;
import com.sched.api.service.AiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/demand-data")
    public List<DemandDataResponse> getDemandData(
            @AuthenticationPrincipal User user
    ) {
        return aiService.getDemandData(user);
    }

    @GetMapping("/predictions")
    public List<AiPredictionResponse> getPredictions(
            @AuthenticationPrincipal User user
    ) {
        return aiService.getPredictions(user);
    }
}