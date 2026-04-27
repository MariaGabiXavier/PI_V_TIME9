package com.sched.api.controller;

import com.sched.api.dto.request.SaleRequest;
import com.sched.api.dto.response.SaleResponse;
import com.sched.api.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sale")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public List<SaleResponse> getAll() {
        return saleService.getAll();
    }

    @PostMapping("/{id}") // id do produto
    public SaleResponse create(@PathVariable Long id, @Valid @RequestBody SaleRequest dto) {
        return saleService.create(id, dto);
    }
}