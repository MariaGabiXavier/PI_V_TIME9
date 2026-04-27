package com.sched.api.service;

import com.sched.api.domain.Product;
import com.sched.api.domain.Sale;
import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.request.SaleRequest;
import com.sched.api.dto.response.SaleResponse;
import com.sched.api.exception.InsufficientStockException;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.ProductRepository;
import com.sched.api.repository.SaleRepository;
import com.sched.api.repository.StockRepository;
import com.sched.api.repository.UserRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    public List<SaleResponse> getAll() {
        List<Sale> sales = saleRepository.findAll();

        return sales.stream()
                .map(SaleResponse::new)
                .toList();
    }

    public SaleResponse create(Long id, SaleRequest dto) {
        User authUser = SecurityUtils.getAuthenticatedUser();

        User user = userRepository.findByEmail(authUser.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("user not found or inactive with email: " + id));

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("product not found or inactive with id: " + id));

        List<Stock> stocks = stockRepository
                .findByProductIdOrderByExpirationDateAsc(product.getId());

        int quantityToSell = dto.totalSold();

        for (Stock stock : stocks) {

            if (quantityToSell == 0) break;

            int available = stock.getQuantity();

            if (available <= quantityToSell) {
                quantityToSell -= available;
                stock.setQuantity(0);
            } else {
                stock.setQuantity(available - quantityToSell);
                quantityToSell = 0;
            }

            stockRepository.save(stock);
        }

        if (quantityToSell > 0) {
            throw new InsufficientStockException("Insufficient stock to complete sale.");
        }

        double totalPrice = product.getPrice() * dto.totalSold();

        Sale sale = new Sale(null, dto.totalSold(), totalPrice, null, product, user);

        return new SaleResponse(saleRepository.save(sale));
    }
}
