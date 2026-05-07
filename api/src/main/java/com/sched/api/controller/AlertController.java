package com.sched.api.controller;


import com.sched.api.dto.response.AlertResponse;
import com.sched.api.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/alert")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<AlertResponse>> getProductsExpiringInNext30Days() {
        return ResponseEntity.ok(alertService.getProductsExpiringInNext30Days());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<AlertResponse>> getProductsWithLowStock() {
        return ResponseEntity.ok(alertService.getProductsWithLowStock());
    }
}
