package com.sched.api.controller;

import com.sched.api.dto.response.DemandDataResponse;
import com.sched.api.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/demand-data")
    public List<DemandDataResponse> getDemandData() {
        return aiService.getDemandData();
    }
}
