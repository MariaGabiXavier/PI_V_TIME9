package com.sched.api;

import com.sched.api.domain.Company;
import com.sched.api.domain.Product;
import com.sched.api.domain.User;
import com.sched.api.dto.request.ProductRequest;
import com.sched.api.dto.response.ProductResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.ProductRepository;
import com.sched.api.repository.StockRepository;
import com.sched.api.service.ProductService;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long OTHER_COMPANY_ID = 2L;
    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 1L;
    private static final Long NONEXISTENT_PRODUCT_ID = 99L;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String OTHER_COMPANY_NAME = "Outra Empresa";
    private static final String OTHER_COMPANY_CNPJ = "00.000.000/0001-00";

    private static final String PRODUCT_NAME = "Produto A";
    private static final String PRODUCT_CATEGORY = "Categoria X";
    private static final Double PRODUCT_PRICE = 10.0;
    private static final String PRODUCT_UNIT_OF_MEASURE = "UN";

    private static final String NEW_PRODUCT_NAME = "Produto Novo";
    private static final String NEW_PRODUCT_CATEGORY = "Categoria Y";
    private static final Double NEW_PRODUCT_PRICE = 25.0;
    private static final String NEW_PRODUCT_UNIT_OF_MEASURE = "KG";

    private static final String UPDATED_PRODUCT_NAME = "Nome Atualizado";
    private static final String UPDATED_PRODUCT_CATEGORY = "Nova Cat";
    private static final Double UPDATED_PRODUCT_PRICE = 99.9;
    private static final String UPDATED_PRODUCT_UNIT_OF_MEASURE = "L";

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private StockService stockService;

    @InjectMocks
    private ProductService productService;

    private Company company;
    private Product product;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
        product = criarProdutoValido(company);
        authenticatedUser = criarUsuarioAutenticado(company);
    }

    @Test
    void findAll_QuandoUsuarioAutenticadoPossuiEmpresa_RetornaProdutosDaEmpresa() {
        // Arrange
        when(productRepository.findAllByCompanyIdAndDeletedFalse(COMPANY_ID))
                .thenReturn(List.of(product));

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final List<ProductResponse> response = productService.findAll();

            // Assert
            assertAll(
                    () -> assertEquals(1, response.size()),
                    () -> assertEquals(PRODUCT_ID, response.get(0).id()),
                    () -> assertEquals(PRODUCT_NAME, response.get(0).name())
            );

            verify(productRepository)
                    .findAllByCompanyIdAndDeletedFalse(COMPANY_ID);
        }
    }

    @Test
    void findAll_QuandoUsuarioEstaDeletado_LancaAccessDeniedException() {
        // Arrange
        authenticatedUser.setDeleted(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action = () -> productService.findAll();

            // Assert
            assertThrows(AccessDeniedException.class, action);
        }
    }

    @Test
    void findAll_QuandoEmpresaEstaDeletada_LancaAccessDeniedException() {
        // Arrange
        company.setDeleted(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action = () -> productService.findAll();

            // Assert
            assertThrows(AccessDeniedException.class, action);
        }
    }

    @Test
    void findById_QuandoProdutoExisteEPertenceEmpresa_RetornaProductResponse() {
        // Arrange
        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(product));

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final ProductResponse response = productService.findById(PRODUCT_ID);

            // Assert
            assertAll(
                    () -> assertNotNull(response),
                    () -> assertEquals(PRODUCT_ID, response.id()),
                    () -> assertEquals(PRODUCT_NAME, response.name())
            );

            verify(productRepository)
                    .findByIdAndDeletedFalse(PRODUCT_ID);
        }
    }

    @Test
    void findById_QuandoProdutoNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        when(productRepository.findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> productService.findById(NONEXISTENT_PRODUCT_ID);

            // Assert
            assertThrows(ResourceNotFoundException.class, action);

            verify(productRepository)
                    .findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID);
        }
    }

    @Test
    void findById_QuandoProdutoPertenceEmpresaDiferente_LancaAccessDeniedException() {
        // Arrange
        final Product otherProduct = criarProdutoValido(criarOutraEmpresaValida());

        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(otherProduct));

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action = () -> productService.findById(PRODUCT_ID);

            // Assert
            assertThrows(AccessDeniedException.class, action);

            verify(productRepository)
                    .findByIdAndDeletedFalse(PRODUCT_ID);
        }
    }

    @Test
    void create_QuandoDadosForemValidos_SalvaProdutoECriaEstoquePadrao() {
        // Arrange
        final ProductRequest request = criarProductRequestValido();

        when(productRepository.save(any(Product.class)))
                .thenReturn(product);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final ProductResponse response = productService.create(request);

            // Assert
            assertNotNull(response);

            verify(productRepository)
                    .save(any(Product.class));

            verify(stockService)
                    .create(eq(PRODUCT_ID), any());
        }
    }

    @Test
    void create_QuandoUsuarioEstaDeletado_LancaAccessDeniedException() {
        // Arrange
        final ProductRequest request = criarProductRequestValido();

        authenticatedUser.setDeleted(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action = () -> productService.create(request);

            // Assert
            assertThrows(AccessDeniedException.class, action);
        }
    }

    @Test
    void update_QuandoDadosForemValidos_AtualizaProduto() {
        // Arrange
        final ProductRequest request = criarProductUpdateRequestValido();

        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(product));

        when(productRepository.save(any(Product.class)))
                .thenReturn(product);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final ProductResponse response =
                    productService.update(PRODUCT_ID, request);

            // Assert
            assertAll(
                    () -> assertNotNull(response),
                    () -> assertEquals(UPDATED_PRODUCT_NAME, product.getName()),
                    () -> assertEquals(UPDATED_PRODUCT_CATEGORY, product.getCategory()),
                    () -> assertEquals(UPDATED_PRODUCT_PRICE, product.getPrice()),
                    () -> assertEquals(PRODUCT_UNIT_OF_MEASURE, product.getUnitOfMeasure()),
                    () -> assertFalse(product.getIsPerishable())
            );

            verify(productRepository)
                    .findByIdAndDeletedFalse(PRODUCT_ID);

            verify(productRepository)
                    .save(product);
        }
    }

    @Test
    void delete_QuandoProdutoPertenceEmpresaDoUsuario_RealizaExclusaoLogica() {
        // Arrange
        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID))
                .thenReturn(Optional.of(product));

        when(stockRepository
                .existsByProductIdAndQuantityGreaterThanAndProduct_DeletedFalse(
                        PRODUCT_ID,
                        0
                ))
                .thenReturn(false);

        when(productRepository.save(any(Product.class)))
                .thenReturn(product);

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            productService.delete(PRODUCT_ID);

            // Assert
            assertTrue(product.getDeleted());

            verify(productRepository)
                    .findByIdAndDeletedFalse(PRODUCT_ID);

            verify(stockRepository)
                    .existsByProductIdAndQuantityGreaterThanAndProduct_DeletedFalse(
                            PRODUCT_ID,
                            0
                    );

            verify(productRepository)
                    .save(product);
        }
    }

    @Test
    void delete_QuandoProdutoNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        when(productRepository.findByIdAndDeletedFalse(NONEXISTENT_PRODUCT_ID))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockSecurityUtils(authenticatedUser)) {

            // Act
            final Executable action =
                    () -> productService.delete(NONEXISTENT_PRODUCT_ID);

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

    private ProductRequest criarProductRequestValido() {
        return new ProductRequest(
                NEW_PRODUCT_NAME,
                NEW_PRODUCT_CATEGORY,
                NEW_PRODUCT_PRICE,
                NEW_PRODUCT_UNIT_OF_MEASURE,
                false
        );
    }

    private ProductRequest criarProductUpdateRequestValido() {
        return new ProductRequest(
                UPDATED_PRODUCT_NAME,
                UPDATED_PRODUCT_CATEGORY,
                UPDATED_PRODUCT_PRICE,
                UPDATED_PRODUCT_UNIT_OF_MEASURE,
                false
        );
    }
}