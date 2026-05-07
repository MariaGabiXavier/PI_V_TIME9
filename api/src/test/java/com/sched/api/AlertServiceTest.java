package com.sched.api;

import com.sched.api.domain.Company;
import com.sched.api.domain.Product;
import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.response.AlertResponse;
import com.sched.api.repository.AlertRepository;
import com.sched.api.service.AlertService;
import com.sched.api.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long PRODUCT_ID = 1L;
    private static final Long STOCK_ID = 1L;

    private static final Integer LOW_STOCK_LIMIT = 20;
    private static final Integer STOCK_QUANTITY = 10;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String PRODUCT_NAME = "Produto A";
    private static final String PRODUCT_CATEGORY = "Categoria X";
    private static final Double PRODUCT_PRICE = 10.0;
    private static final String PRODUCT_UNIT_OF_MEASURE = "UN";

    private static final LocalDateTime EXPIRATION_DATE = LocalDateTime.of(2026, 2, 1, 10, 0);

    @Mock
    private AlertRepository alertRepository;

    @InjectMocks
    private AlertService alertService;

    private Company company;
    private User authenticatedUser;
    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
        authenticatedUser = criarUsuarioAutenticado(company);
        product = criarProdutoValido(company);
        stock = criarEstoqueValido(product);
    }

    @Test
    void getProductsExpiringInNext30Days_QuandoExistemProdutosAVencer_RetornaListaDeAlertas() {
        // Arrange
        when(alertRepository.findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq(COMPANY_ID)
        )).thenReturn(List.of(stock));

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {
            // Act
            final List<AlertResponse> response = alertService.getProductsExpiringInNext30Days();

            // Assert
            assertEquals(1, response.size());
            verify(alertRepository).findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
                    any(LocalDateTime.class),
                    any(LocalDateTime.class),
                    eq(COMPANY_ID)
            );
        }
    }

    @Test
    void getProductsExpiringInNext30Days_QuandoNaoExistemProdutosAVencer_RetornaListaVazia() {
        // Arrange
        when(alertRepository.findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq(COMPANY_ID)
        )).thenReturn(List.of());

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {
            // Act
            final List<AlertResponse> response = alertService.getProductsExpiringInNext30Days();

            // Assert
            assertTrue(response.isEmpty());
            verify(alertRepository).findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
                    any(LocalDateTime.class),
                    any(LocalDateTime.class),
                    eq(COMPANY_ID)
            );
        }
    }

    @Test
    void getProductsWithLowStock_QuandoExistemProdutosComEstoqueBaixo_RetornaListaDeAlertas() {
        // Arrange
        when(alertRepository.findByQuantityLessThanEqualAndProduct_Company_IdAndProduct_DeletedFalse(
                LOW_STOCK_LIMIT,
                COMPANY_ID
        )).thenReturn(List.of(stock));

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {
            // Act
            final List<AlertResponse> response = alertService.getProductsWithLowStock();

            // Assert
            assertEquals(1, response.size());
            verify(alertRepository).findByQuantityLessThanEqualAndProduct_Company_IdAndProduct_DeletedFalse(
                    LOW_STOCK_LIMIT,
                    COMPANY_ID
            );
        }
    }

    @Test
    void getProductsWithLowStock_QuandoNaoExistemProdutosComEstoqueBaixo_RetornaListaVazia() {
        // Arrange
        when(alertRepository.findByQuantityLessThanEqualAndProduct_Company_IdAndProduct_DeletedFalse(
                LOW_STOCK_LIMIT,
                COMPANY_ID
        )).thenReturn(List.of());

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {
            // Act
            final List<AlertResponse> response = alertService.getProductsWithLowStock();

            // Assert
            assertTrue(response.isEmpty());
            verify(alertRepository).findByQuantityLessThanEqualAndProduct_Company_IdAndProduct_DeletedFalse(
                    LOW_STOCK_LIMIT,
                    COMPANY_ID
            );
        }
    }

    private MockedStatic<SecurityUtils> mockSecurityUtils(final User user) {
        final MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class);

        securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(user);

        return securityUtils;
    }

    private Company criarEmpresaValida() {
        return new Company(
                COMPANY_ID,
                COMPANY_NAME,
                COMPANY_CNPJ,
                false,
                null
        );
    }

    private User criarUsuarioAutenticado(final Company company) {
        final User user = new User();

        user.setCompany(company);

        return user;
    }

    private Product criarProdutoValido(final Company company) {
        return new Product(
                PRODUCT_ID,
                PRODUCT_NAME,
                PRODUCT_CATEGORY,
                PRODUCT_PRICE,
                PRODUCT_UNIT_OF_MEASURE,
                false,
                null,
                false,
                company
        );
    }

    private Stock criarEstoqueValido(final Product product) {
        final Stock stock = new Stock();

        stock.setId(STOCK_ID);
        stock.setExpirationDate(EXPIRATION_DATE);
        stock.setQuantity(STOCK_QUANTITY);
        stock.setProduct(product);

        return stock;
    }
}