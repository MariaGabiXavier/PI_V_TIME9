package com.sched.api.service;

import com.sched.api.domain.Company;
import com.sched.api.domain.Product;
import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.request.ProductRequest;
import com.sched.api.dto.request.StockRequest;
import com.sched.api.dto.response.ProductResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.ProductRepository;
import com.sched.api.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final StockService stockService;

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        User authUser = SecurityUtils.getAuthenticatedUser();
        Company company = authUser.getCompany();

        if(authUser.getDeleted() || company.getDeleted()){
            throw new AccessDeniedException("Not authorized to create product, user/company has be deleted");
        }

        return productRepository.findAllByCompanyId(authUser.getCompany().getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = validateUserCompanyAccess(id);

        return new ProductResponse(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest dto) {
        User authUser = SecurityUtils.getAuthenticatedUser();
        Company company = authUser.getCompany();

        if(authUser.getDeleted() || company.getDeleted()){
            throw new AccessDeniedException("Not authorized to create product, user/company has be deleted");
        }

        Product product = new Product(null, dto.name(), dto.category(), dto.price(), dto.unitOfMeasure(), dto.isPerishable(), null, company);

        Product savedProduct = productRepository.save(product);

        LocalDateTime defaultDate = LocalDateTime.of(1970, 1, 1, 0, 0);
        StockRequest dtoS = new StockRequest(0, defaultDate);

        stockService.create(savedProduct.getId(), dtoS);

        return new ProductResponse(product);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest updatedProduct) {
        Product product = validateUserCompanyAccess(id);

        product.setName(updatedProduct.name());
        product.setCategory(updatedProduct.category());
        product.setPrice(updatedProduct.price());
        product.setIsPerishable(updatedProduct.isPerishable());

        productRepository.save(product);

        return new ProductResponse(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = validateUserCompanyAccess(id);

        productRepository.delete(product);
    }

    private Product validateUserCompanyAccess(Long productId) {
        User authUser = SecurityUtils.getAuthenticatedUser();
        Company company = authUser.getCompany();

        if(authUser.getDeleted() || company.getDeleted()){
            throw new AccessDeniedException("Not authorized to product, user/company has be deleted");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or inactive with id: " + productId));

        if(!Objects.equals(product.getCompany().getId(), company.getId())){
            throw new AccessDeniedException("Access denied: different company");
        }

        return product;
    }

    private ProductResponse mapToResponse(Product product) {
        return new ProductResponse(product);
    }
}