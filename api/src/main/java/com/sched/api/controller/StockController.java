package com.sched.api.controller;

import com.sched.api.dto.request.StockRequest;
import com.sched.api.dto.response.StockBatchResponse;
import com.sched.api.dto.response.StockResponse;
import com.sched.api.service.StockService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock")
public class StockController {

    private StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // RETORNA TODOS OS LOTES DA EMPRESA SEM FILTRO POR PRODUTO
    @GetMapping
    public List<StockBatchResponse> getAll() {
        return stockService.getAll();
    }

    // RETORNA TODOS OS LOTES DA EMPRESA FILTRADO POR PRODUTO
    @GetMapping("/filterProduct")
    public List<StockResponse> findById() {
        return stockService.getProductStockSummary();
    }

    // CRIAR UM LOTE P/ EMPRESA
    @PostMapping("/{id}") // id é do produto
    public StockBatchResponse create(@PathVariable Long id, @Valid @RequestBody StockRequest dto) {
        return stockService.create(id, dto);
    }

    // ATUALIZA UM LOTE P/ EMPRESA
    @PutMapping("/{id}") // id é do lote
    public StockBatchResponse update(@PathVariable Long id, @Valid @RequestBody StockRequest dto) {
        return stockService.update(id, dto);
    }

    // DELETE UM LOTE P/ EMPRESA
    @DeleteMapping("/{id}") // id é do lote
    public void delete(@PathVariable Long id) {
        stockService.delete(id);
    }

}
