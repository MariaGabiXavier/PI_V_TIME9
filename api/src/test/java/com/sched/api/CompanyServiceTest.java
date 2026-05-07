package com.sched.api;

import com.sched.api.domain.Company;
import com.sched.api.domain.User;
import com.sched.api.dto.request.CompanyUpdateRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.exception.ResourceNotFoundException;
import com.sched.api.repository.CompanyRepository;
import com.sched.api.service.CompanyService;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long OTHER_COMPANY_ID = 2L;
    private static final Long NONEXISTENT_COMPANY_ID = 99L;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String UPDATED_COMPANY_NAME = "Novo Nome";
    private static final String UPDATED_COMPANY_CNPJ = "98.765.432/0001-11";

    private static final String OTHER_COMPANY_NAME = "Outra Empresa";
    private static final String OTHER_COMPANY_CNPJ = "00.000.000/0001-00";

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    private User authenticatedUser;
    private Company company;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
        authenticatedUser = criarUsuarioAutenticado(company);
    }

    @Test
    void getAll_QuandoExistemEmpresasAtivas_RetornaListaDeEmpresas() {
        // Arrange
        when(companyRepository.findAllByDeletedFalse()).thenReturn(List.of(company));

        // Act
        final List<CompanyResponse> response = companyService.getAll();

        // Assert
        assertAll(
                () -> assertEquals(1, response.size()),
                () -> assertEquals(COMPANY_ID, response.get(0).id()),
                () -> assertEquals(COMPANY_NAME, response.get(0).name())
        );
        verify(companyRepository).findAllByDeletedFalse();
    }

    @Test
    void getAll_QuandoNaoExistemEmpresasAtivas_RetornaListaVazia() {
        // Arrange
        when(companyRepository.findAllByDeletedFalse()).thenReturn(List.of());

        // Act
        final List<CompanyResponse> response = companyService.getAll();

        // Assert
        assertTrue(response.isEmpty());
        verify(companyRepository).findAllByDeletedFalse();
    }

    @Test
    void getById_QuandoEmpresaExiste_RetornaCompanyResponse() {
        // Arrange
        when(companyRepository.findByIdAndDeletedFalse(COMPANY_ID)).thenReturn(Optional.of(company));

        // Act
        final CompanyResponse response = companyService.getById(COMPANY_ID);

        // Assert
        assertAll(
                () -> assertNotNull(response),
                () -> assertEquals(COMPANY_ID, response.id()),
                () -> assertEquals(COMPANY_NAME, response.name())
        );
        verify(companyRepository).findByIdAndDeletedFalse(COMPANY_ID);
    }

    @Test
    void getById_QuandoEmpresaNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        when(companyRepository.findByIdAndDeletedFalse(NONEXISTENT_COMPANY_ID)).thenReturn(Optional.empty());

        // Act
        final Executable action = () -> companyService.getById(NONEXISTENT_COMPANY_ID);

        // Assert
        assertThrows(ResourceNotFoundException.class, action);
        verify(companyRepository).findByIdAndDeletedFalse(NONEXISTENT_COMPANY_ID);
    }

    @Test
    void update_QuandoUsuarioPertenceMesmaEmpresa_RetornaEmpresaAtualizada() {
        // Arrange
        final CompanyUpdateRequest request = criarCompanyUpdateRequestValido();

        when(companyRepository.findByIdAndDeletedFalse(COMPANY_ID)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenReturn(company);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(authenticatedUser);

            // Act
            final CompanyResponse response = companyService.update(COMPANY_ID, request);

            // Assert
            assertAll(
                    () -> assertNotNull(response),
                    () -> assertEquals(COMPANY_ID, response.id()),
                    () -> assertEquals(UPDATED_COMPANY_NAME, company.getName()),
                    () -> assertEquals(UPDATED_COMPANY_CNPJ, company.getCnpj())
            );

            verify(companyRepository).findByIdAndDeletedFalse(COMPANY_ID);
            verify(companyRepository).save(company);
        }
    }

    @Test
    void update_QuandoUsuarioPertenceEmpresaDiferente_LancaAccessDeniedException() {
        // Arrange
        final CompanyUpdateRequest request = criarCompanyUpdateRequestValido();
        final User otherUser = criarUsuarioAutenticado(criarOutraEmpresaValida());

        when(companyRepository.findByIdAndDeletedFalse(COMPANY_ID)).thenReturn(Optional.of(company));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(otherUser);

            // Act
            final Executable action = () -> companyService.update(COMPANY_ID, request);

            // Assert
            assertThrows(AccessDeniedException.class, action);
            verify(companyRepository).findByIdAndDeletedFalse(COMPANY_ID);
        }
    }

    @Test
    void delete_QuandoUsuarioPertenceMesmaEmpresa_MarcaEmpresaComoDeletada() {
        // Arrange
        when(companyRepository.findByIdAndDeletedFalse(COMPANY_ID)).thenReturn(Optional.of(company));
        when(companyRepository.save(any(Company.class))).thenReturn(company);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(authenticatedUser);

            // Act
            companyService.delete(COMPANY_ID);

            // Assert
            assertTrue(company.getDeleted());
            verify(companyRepository).findByIdAndDeletedFalse(COMPANY_ID);
            verify(companyRepository).save(company);
        }
    }

    @Test
    void delete_QuandoEmpresaNaoExiste_LancaResourceNotFoundException() {
        // Arrange
        when(companyRepository.findByIdAndDeletedFalse(NONEXISTENT_COMPANY_ID)).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(authenticatedUser);

            // Act
            final Executable action = () -> companyService.delete(NONEXISTENT_COMPANY_ID);

            // Assert
            assertThrows(ResourceNotFoundException.class, action);
            verify(companyRepository).findByIdAndDeletedFalse(NONEXISTENT_COMPANY_ID);
        }
    }

    @Test
    void delete_QuandoUsuarioPertenceEmpresaDiferente_LancaAccessDeniedException() {
        // Arrange
        final User otherUser = criarUsuarioAutenticado(criarOutraEmpresaValida());

        when(companyRepository.findByIdAndDeletedFalse(COMPANY_ID)).thenReturn(Optional.of(company));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getAuthenticatedUser).thenReturn(otherUser);

            // Act
            final Executable action = () -> companyService.delete(COMPANY_ID);

            // Assert
            assertThrows(AccessDeniedException.class, action);
            verify(companyRepository).findByIdAndDeletedFalse(COMPANY_ID);
        }
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

        user.setCompany(company);

        return user;
    }

    private CompanyUpdateRequest criarCompanyUpdateRequestValido() {
        return new CompanyUpdateRequest(
                UPDATED_COMPANY_NAME,
                UPDATED_COMPANY_CNPJ
        );
    }
}