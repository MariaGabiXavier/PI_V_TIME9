package com.sched.api;

import com.sched.api.domain.Company;
import com.sched.api.domain.Product;
import com.sched.api.domain.Stock;
import com.sched.api.domain.User;
import com.sched.api.dto.request.StockRequest;
import com.sched.api.dto.response.StockBatchResponse;
import com.sched.api.dto.response.StockResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.ProductRepository;
import com.sched.api.repository.StockRepository;
import com.sched.api.service.StockService;
import com.sched.api.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.function.Executable;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long OTHER_COMPANY_ID = 2L;

    private static final Long USER_ID = 1L;

    private static final Long PRODUCT_ID = 1L;
    private static final Long OTHER_PRODUCT_ID = 2L;

    private static final Long STOCK_ID = 1L;
    private static final Long OTHER_STOCK_ID = 2L;

    private static final Long NONEXISTENT_PRODUCT_ID = 99L;
    private static final Long NONEXISTENT_STOCK_ID = 99L;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String OTHER_COMPANY_NAME = "Outra Empresa";
    private static final String OTHER_COMPANY_CNPJ = "00.000.000/0001-00";

    private static final String USER_NAME = "Usuário Teste";

    private static final String PRODUCT_NAME = "Produto A";
    private static final String PRODUCT_CATEGORY = "Categoria X";
    private static final Double PRODUCT_PRICE = 10.0;
    private static final String PRODUCT_UNIT_OF_MEASURE = "UN";

    private static final String OTHER_PRODUCT_NAME = "Produto B";
    private static final String OTHER_PRODUCT_CATEGORY = "Categoria Y";
    private static final Double OTHER_PRODUCT_PRICE = 5.0;
    private static final String OTHER_PRODUCT_UNIT_OF_MEASURE = "KG";

    private static final Integer STOCK_QUANTITY = 30;
    private static final Integer ADDITIONAL_STOCK_QUANTITY = 20;
    private static final Integer TOTAL_STOCK_QUANTITY = 50;

    private static final Integer CREATE_STOCK_QUANTITY = 100;
    private static final Integer UPDATE_STOCK_QUANTITY = 200;
    private static final Integer OTHER_STOCK_QUANTITY = 50;

    private static final LocalDateTime CREATED_AT =
            LocalDateTime.of(2026, 1, 1, 10, 0);

    private static final LocalDateTime STOCK_EXPIRATION_DATE =
            LocalDateTime.of(2026, 3, 1, 10, 0);

    private static final LocalDateTime ADDITIONAL_STOCK_EXPIRATION_DATE =
            LocalDateTime.of(2026, 4, 1, 10, 0);

    private static final LocalDateTime SOON_TO_EXPIRE_DATE =
            LocalDateTime.of(2026, 1, 15, 10, 0);

    private static final LocalDateTime CREATE_STOCK_EXPIRATION_DATE =
            LocalDateTime.of(2026, 2, 1, 10, 0);

    private static final LocalDateTime UPDATE_STOCK_EXPIRATION_DATE =
            LocalDateTime.of(2026, 5, 1, 10, 0);

    private static final LocalDateTime OTHER_STOCK_EXPIRATION_DATE =
            LocalDateTime.of(2026, 1, 20, 10, 0);

    @Mock
    private StockRepository stockRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private StockService stockService;

    private Company company;
    private User authenticatedUser;
    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
        authenticatedUser = criarUsuarioAutenticado(company);
        product = criarProdutoValido(company);
        stock = criarLoteEstoqueValido(product, authenticatedUser);
    }

    @Test
    void getAll_QuandoUsuarioPossuiEmpresa_RetornaLotesDeEstoqueDaEmpresa() {
        // Arrange
        when(stockRepository.findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID))
                .thenReturn(List.of(stock));

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final List<StockBatchResponse> response = stockService.getAll();

            // Assert
            assertEquals(1, response.size());

            verify(stockRepository)
                    .findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID);
        }
    }

    @Test
    void getProductStockSummary_QuandoExistemLotesDoMesmoProduto_RetornaProdutoComQuantidadeSomada() {
        // Arrange
        final Stock additionalStock = criarLoteEstoque(
                OTHER_STOCK_ID,
                ADDITIONAL_STOCK_QUANTITY,
                ADDITIONAL_STOCK_EXPIRATION_DATE,
                product,
                authenticatedUser
        );

        when(stockRepository.findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID))
                .thenReturn(List.of(stock, additionalStock));

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final List<StockResponse> response =
                    stockService.getProductStockSummary();

            // Assert
            assertAll(
                    () -> assertEquals(1, response.size()),
                    () -> assertEquals(
                            TOTAL_STOCK_QUANTITY,
                            response.get(0).availableQuantity()
                    )
            );

            verify(stockRepository)
                    .findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID);
        }
    }

    @Test
    void getProductStockSummary_QuandoExistemLotesComVencimentosDiferentes_RetornaMenorVencimento() {
        // Arrange
        final Stock laterStock = criarLoteEstoque(
                STOCK_ID,
                STOCK_QUANTITY,
                ADDITIONAL_STOCK_EXPIRATION_DATE,
                product,
                authenticatedUser
        );

        final Stock soonToExpireStock = criarLoteEstoque(
                OTHER_STOCK_ID,
                ADDITIONAL_STOCK_QUANTITY,
                SOON_TO_EXPIRE_DATE,
                product,
                authenticatedUser
        );

        when(stockRepository.findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID))
                .thenReturn(List.of(laterStock, soonToExpireStock));

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final List<StockResponse> response =
                    stockService.getProductStockSummary();

            // Assert
            assertEquals(
                    SOON_TO_EXPIRE_DATE,
                    response.get(0).nextToExpireDate()
            );

            verify(stockRepository)
                    .findByProduct_Company_IdAndProduct_DeletedFalse(COMPANY_ID);
        }
    }

    @Test
    void create_QuandoDadosForemValidos_RetornaStockBatchResponse() {
        // Arrange
        final StockRequest request = criarStockRequestValido();

        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(product));

        when(stockRepository.save(any(Stock.class)))
                .thenReturn(stock);

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final StockBatchResponse response =
                    stockService.create(PRODUCT_ID, request);

            // Assert
            assertNotNull(response);

            verify(productRepository).findByIdAndDeletedFalse(PRODUCT_ID);
            verify(stockRepository).save(any(Stock.class));
        }
    }

    @Test
    void create_QuandoProdutoNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        final StockRequest request = criarStockRequestValido();

        when(productRepository.findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> stockService.create(NONEXISTENT_PRODUCT_ID, request);

            // Assert
            assertThrows(ResourceNotFoundException.class, action);

            verify(productRepository)
                    .findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID);
        }
    }

    @Test
    void create_QuandoUsuarioEstaDeletado_LancaAccessDeniedException() {
        // Arrange
        final StockRequest request = criarStockRequestValido();

        authenticatedUser.setDeleted(true);

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> stockService.create(PRODUCT_ID, request);

            // Assert
            assertThrows(AccessDeniedException.class, action);
        }
    }

    @Test
    void update_QuandoDadosForemValidos_AtualizaQuantidadeEVencimento() {
        // Arrange
        final StockRequest request = criarStockUpdateRequestValido();

        when(stockRepository.findByIdAndProduct_DeletedFalse(STOCK_ID))
                .thenReturn(Optional.of(stock));

        when(stockRepository.save(any(Stock.class)))
                .thenReturn(stock);

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final StockBatchResponse response =
                    stockService.update(STOCK_ID, request);

            // Assert
            assertAll(
                    () -> assertNotNull(response),
                    () -> assertEquals(
                            UPDATE_STOCK_QUANTITY,
                            stock.getQuantity()
                    ),
                    () -> assertEquals(
                            UPDATE_STOCK_EXPIRATION_DATE,
                            stock.getExpirationDate()
                    )
            );

            verify(stockRepository)
                    .findByIdAndProduct_DeletedFalse(STOCK_ID);

            verify(stockRepository).save(stock);
        }
    }

    @Test
    void update_QuandoLotePertenceEmpresaDiferente_LancaAccessDeniedException() {
        // Arrange
        final StockRequest request = criarStockRequestOutraEmpresa();

        final Stock otherStock = criarLoteEstoqueOutraEmpresa();

        when(stockRepository.findByIdAndProduct_DeletedFalse(STOCK_ID))
                .thenReturn(Optional.of(otherStock));

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> stockService.update(STOCK_ID, request);

            // Assert
            assertThrows(AccessDeniedException.class, action);

            verify(stockRepository)
                    .findByIdAndProduct_DeletedFalse(STOCK_ID);
        }
    }

    @Test
    void delete_QuandoLotePertenceEmpresaDoUsuario_RemoveLote() {
        // Arrange
        when(stockRepository.findByIdAndProduct_DeletedFalse(STOCK_ID))
                .thenReturn(Optional.of(stock));

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            stockService.delete(STOCK_ID);

            // Assert
            verify(stockRepository)
                    .findByIdAndProduct_DeletedFalse(STOCK_ID);

            verify(stockRepository).deleteById(STOCK_ID);
        }
    }

    @Test
    void delete_QuandoLoteNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        when(stockRepository.findByIdAndProduct_DeletedFalse(NONEXISTENT_STOCK_ID))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils =
                     mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> stockService.delete(NONEXISTENT_STOCK_ID);

            // Assert
            assertThrows(ResourceNotFoundException.class, action);

            verify(stockRepository)
                    .findByIdAndProduct_DeletedFalse(NONEXISTENT_STOCK_ID);
        }
    }

    private MockedStatic<SecurityUtils> mockSecurityUtils(final User user) {
        final MockedStatic<SecurityUtils> securityUtils =
                mockStatic(SecurityUtils.class);

        securityUtils.when(SecurityUtils::getAuthenticatedUser)
                .thenReturn(user);

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

    private Company criarOutraEmpresaValida() {
        return new Company(
                OTHER_COMPANY_ID,
                OTHER_COMPANY_NAME,
                OTHER_COMPANY_CNPJ,
                false,
                null
        );
    }

    private User criarUsuarioAutenticado(final Company company) {
        final User user = new User();

        user.setId(USER_ID);
        user.setName(USER_NAME);
        user.setCompany(company);
        user.setDeleted(false);

        return user;
    }

    private Product criarProdutoValido(final Company company) {
        return new Product(
                PRODUCT_ID,
                PRODUCT_NAME,
                PRODUCT_CATEGORY,
                PRODUCT_PRICE,
                PRODUCT_UNIT_OF_MEASURE,
                true,
                null,
                false,
                company
        );
    }

    private Product criarOutroProdutoValido(final Company company) {
        return new Product(
                OTHER_PRODUCT_ID,
                OTHER_PRODUCT_NAME,
                OTHER_PRODUCT_CATEGORY,
                OTHER_PRODUCT_PRICE,
                OTHER_PRODUCT_UNIT_OF_MEASURE,
                true,
                null,
                false,
                company
        );
    }

    private Stock criarLoteEstoqueValido(
            final Product product,
            final User user
    ) {
        return criarLoteEstoque(
                STOCK_ID,
                STOCK_QUANTITY,
                STOCK_EXPIRATION_DATE,
                product,
                user
        );
    }

    private Stock criarLoteEstoqueOutraEmpresa() {
        final Company otherCompany = criarOutraEmpresaValida();

        final Product otherProduct =
                criarOutroProdutoValido(otherCompany);

        return criarLoteEstoque(
                STOCK_ID,
                OTHER_STOCK_QUANTITY,
                OTHER_STOCK_EXPIRATION_DATE,
                otherProduct,
                authenticatedUser
        );
    }

    private Stock criarLoteEstoque(
            final Long id,
            final Integer quantity,
            final LocalDateTime expirationDate,
            final Product product,
            final User user
    ) {
        final Stock stock = new Stock();

        stock.setId(id);
        stock.setQuantity(quantity);
        stock.setExpirationDate(expirationDate);
        stock.setCreatedAt(CREATED_AT);
        stock.setProduct(product);
        stock.setCreatedBy(user);

        return stock;
    }

    private StockRequest criarStockRequestValido() {
        return new StockRequest(
                CREATE_STOCK_QUANTITY,
                CREATE_STOCK_EXPIRATION_DATE
        );
    }

    private StockRequest criarStockUpdateRequestValido() {
        return new StockRequest(
                UPDATE_STOCK_QUANTITY,
                UPDATE_STOCK_EXPIRATION_DATE
        );
    }

    private StockRequest criarStockRequestOutraEmpresa() {
        return new StockRequest(
                OTHER_STOCK_QUANTITY,
                OTHER_STOCK_EXPIRATION_DATE
        );
    }
}