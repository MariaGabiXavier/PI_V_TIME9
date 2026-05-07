package com.sched.api;

import com.sched.api.domain.Company;
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
import com.sched.api.service.SaleService;
import com.sched.api.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 1L;
    private static final Long STOCK_ID = 1L;
    private static final Long SALE_ID = 1L;
    private static final Long NONEXISTENT_PRODUCT_ID = 99L;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String USER_EMAIL = "user@empresa.com";

    private static final String PRODUCT_NAME = "Produto A";
    private static final String PRODUCT_CATEGORY = "Categoria X";
    private static final Double PRODUCT_PRICE = 10.0;
    private static final String PRODUCT_UNIT_OF_MEASURE = "UN";

    private static final Integer INITIAL_STOCK_QUANTITY = 50;
    private static final Integer INSUFFICIENT_STOCK_QUANTITY = 3;
    private static final Integer SALE_QUANTITY = 10;
    private static final Integer REMAINING_STOCK_QUANTITY = 40;

    private static final Double SALE_TOTAL_PRICE = 100.0;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockRepository stockRepository;

    @InjectMocks
    private SaleService saleService;

    private Company company;
    private User authenticatedUser;
    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
        authenticatedUser = criarUsuarioAutenticado(company);
        product = criarProdutoValido(company);
        stock = criarEstoqueValido(INITIAL_STOCK_QUANTITY);
    }

    @Test
    void getAll_QuandoExistemVendas_RetornaListaDeVendas() {
        // Arrange
        final Sale sale = criarVendaValida(SALE_QUANTITY, SALE_TOTAL_PRICE);

        when(saleRepository.findAll()).thenReturn(List.of(sale));

        // Act
        final List<SaleResponse> response = saleService.getAll();

        // Assert
        assertEquals(1, response.size());

        verify(saleRepository).findAll();
    }

    @Test
    void getAll_QuandoNaoExistemVendas_RetornaListaVazia() {
        // Arrange
        when(saleRepository.findAll()).thenReturn(List.of());

        // Act
        final List<SaleResponse> response = saleService.getAll();

        // Assert
        assertEquals(0, response.size());

        verify(saleRepository).findAll();
    }

    @Test
    void create_QuandoEstoqueSuficiente_RegistraVendaEDecrementaEstoque() {
        // Arrange
        final SaleRequest request = criarSaleRequestValido();
        final Sale sale = criarVendaValida(SALE_QUANTITY, SALE_TOTAL_PRICE);

        mockUsuarioAutenticado();
        mockProdutoExistente();
        mockEstoquesDoProduto(stock);

        when(saleRepository.save(any(Sale.class))).thenReturn(sale);

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final SaleResponse response =
                    saleService.create(PRODUCT_ID, request);

            // Assert
            assertAll(
                    () -> assertNotNull(response),
                    () -> assertEquals(
                            REMAINING_STOCK_QUANTITY,
                            stock.getQuantity()
                    )
            );

            verify(stockRepository).save(stock);
            verify(saleRepository).save(any(Sale.class));
        }
    }

    @Test
    void create_QuandoEstoqueInsuficiente_LancaInsufficientStockException() {
        // Arrange
        final SaleRequest request = criarSaleRequestValido();

        stock.setQuantity(INSUFFICIENT_STOCK_QUANTITY);

        mockUsuarioAutenticado();
        mockProdutoExistente();
        mockEstoquesDoProduto(stock);

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> saleService.create(PRODUCT_ID, request);

            // Assert
            assertThrows(InsufficientStockException.class, action);
        }
    }

    @Test
    void create_QuandoProdutoNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        final SaleRequest request = criarSaleRequestValido();

        mockUsuarioAutenticado();

        when(productRepository.findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> saleService.create(
                            NONEXISTENT_PRODUCT_ID,
                            request
                    );

            // Assert
            assertThrows(ResourceNotFoundException.class, action);

            verify(productRepository)
                    .findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID);
        }
    }

    private MockedStatic<SecurityUtils> mockSecurityUtils(final User user) {
        final MockedStatic<SecurityUtils> securityUtils =
                mockStatic(SecurityUtils.class);

        securityUtils.when(SecurityUtils::getAuthenticatedUser)
                .thenReturn(user);

        return securityUtils;
    }

    private void mockUsuarioAutenticado() {
        when(userRepository.findByEmail(USER_EMAIL))
                .thenReturn(Optional.of(authenticatedUser));
    }

    private void mockProdutoExistente() {
        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(product));
    }

    private void mockEstoquesDoProduto(final Stock... stocks) {
        when(stockRepository
                .findByProductIdAndProduct_DeletedFalseOrderByExpirationDateAsc(
                        PRODUCT_ID
                ))
                .thenReturn(List.of(stocks));
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

        user.setId(USER_ID);
        user.setEmail(USER_EMAIL);
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

    private Stock criarEstoqueValido(final Integer quantity) {
        final Stock stock = new Stock();

        stock.setId(STOCK_ID);
        stock.setQuantity(quantity);
        stock.setProduct(product);

        return stock;
    }

    private SaleRequest criarSaleRequestValido() {
        return new SaleRequest(SALE_QUANTITY);
    }

    private Sale criarVendaValida(
            final Integer quantity,
            final Double totalPrice
    ) {
        return new Sale(
                SALE_ID,
                quantity,
                totalPrice,
                null,
                product,
                authenticatedUser
        );
    }
}