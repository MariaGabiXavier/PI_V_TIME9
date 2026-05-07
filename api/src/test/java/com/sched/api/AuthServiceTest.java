package com.sched.api;

import com.sched.api.domain.Company;
import com.sched.api.domain.Role;
import com.sched.api.domain.User;
import com.sched.api.dto.request.CompanyRequest;
import com.sched.api.dto.request.UserRequest;
import com.sched.api.dto.response.CompanyResponse;
import com.sched.api.dto.response.UserResponse;
import com.sched.api.repository.CompanyRepository;
import com.sched.api.repository.UserRepository;
import com.sched.api.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final Long COMPANY_ID = 1L;
    private static final Long USER_ID = 2L;

    private static final String COMPANY_NAME = "Empresa Teste";
    private static final String COMPANY_CNPJ = "12.345.678/0001-99";

    private static final String ADMIN_NAME = "Admin";
    private static final String ADMIN_EMAIL = "admin@empresa.com";

    private static final String USER_NAME = "João Silva";
    private static final String USER_EMAIL = "joao@empresa.com";

    private static final String RAW_PASSWORD = "senha123";
    private static final String ENCODED_PASSWORD = "encoded_password";

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private Company company;

    @BeforeEach
    void setUp() {
        company = criarEmpresaValida();
    }

    @Test
    void registerCompany_QuandoDadosForemValidos_RetornaCompanyResponse() {
        // Arrange
        final CompanyRequest request = criarCompanyRequestValido();

        mockSalvarEmpresa();
        mockCodificarSenha();

        // Act
        final CompanyResponse response = authService.registerCompany(request);

        // Assert
        assertAll(
                () -> assertNotNull(response),
                () -> assertEquals(COMPANY_ID, response.id()),
                () -> assertEquals(COMPANY_NAME, response.name())
        );
        verify(companyRepository).save(any(Company.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerCompany_QuandoEmpresaForRegistrada_CriaUsuarioAdmin() {
        // Arrange
        final CompanyRequest request = criarCompanyRequestValido();
        final ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        mockSalvarEmpresa();
        mockCodificarSenha();

        // Act
        authService.registerCompany(request);

        // Assert
        verify(userRepository).save(userCaptor.capture());
        final User admin = userCaptor.getValue();
        assertAll(
                () -> assertEquals(Role.ADMIN, admin.getRole()),
                () -> assertEquals(ADMIN_EMAIL, admin.getEmail()),
                () -> assertEquals(ENCODED_PASSWORD, admin.getPassword()),
                () -> assertEquals(company, admin.getCompany())
        );
    }

    @Test
    void registerCompany_QuandoSenhaForInformada_CodificaSenha() {
        // Arrange
        final CompanyRequest request = criarCompanyRequestValido();

        mockSalvarEmpresa();
        mockCodificarSenha();

        // Act
        authService.registerCompany(request);

        // Assert
        verify(passwordEncoder).encode(RAW_PASSWORD);
    }

    @Test
    void registerUser_QuandoDadosForemValidos_RetornaUserResponse() {
        // Arrange
        final User admin = criarAdminValido();
        final UserRequest request = criarUserRequestValido();
        final User userSalvo = criarUsuarioSalvo();

        mockCodificarSenha();
        when(userRepository.save(any(User.class))).thenReturn(userSalvo);

        // Act
        final UserResponse response = authService.registerUser(request, admin);

        // Assert
        assertAll(
                () -> assertNotNull(response),
                () -> assertEquals(USER_EMAIL, response.email()),
                () -> assertEquals(Role.USER, response.role()),
                () -> assertEquals(COMPANY_ID, response.companyId())
        );
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_QuandoUsuarioForRegistrado_AssociaEmpresaDoAdmin() {
        // Arrange
        final User admin = criarAdminValido();
        final UserRequest request = criarUserRequestValido();
        final ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        mockCodificarSenha();
        mockSalvarUsuarioRecebido();

        // Act
        authService.registerUser(request, admin);

        // Assert
        verify(userRepository).save(userCaptor.capture());
        final User usuarioSalvo = userCaptor.getValue();
        assertAll(
                () -> assertEquals(Role.USER, usuarioSalvo.getRole()),
                () -> assertEquals(company, usuarioSalvo.getCompany()),
                () -> assertEquals(USER_EMAIL, usuarioSalvo.getEmail())
        );
    }

    @Test
    void registerUser_QuandoSenhaForInformada_CodificaSenha() {
        // Arrange
        final User admin = criarAdminValido();
        final UserRequest request = criarUserRequestValido();

        mockCodificarSenha();
        mockSalvarUsuarioRecebido();

        // Act
        authService.registerUser(request, admin);

        // Assert
        verify(passwordEncoder).encode(RAW_PASSWORD);
    }

    private void mockSalvarEmpresa() {
        when(companyRepository.save(any(Company.class))).thenReturn(company);
    }

    private void mockCodificarSenha() {
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
    }

    private void mockSalvarUsuarioRecebido() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
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

    private CompanyRequest criarCompanyRequestValido() {
        return new CompanyRequest(
                COMPANY_NAME,
                COMPANY_CNPJ,
                ADMIN_EMAIL,
                RAW_PASSWORD
        );
    }

    private UserRequest criarUserRequestValido() {
        return new UserRequest(
                USER_NAME,
                USER_EMAIL,
                RAW_PASSWORD
        );
    }

    private User criarAdminValido() {
        final User admin = new User();

        admin.setId(COMPANY_ID);
        admin.setName(ADMIN_NAME);
        admin.setEmail(ADMIN_EMAIL);
        admin.setRole(Role.ADMIN);
        admin.setCompany(company);

        return admin;
    }

    private User criarUsuarioSalvo() {
        final User user = new User();

        user.setId(USER_ID);
        user.setName(USER_NAME);
        user.setEmail(USER_EMAIL);
        user.setPassword(ENCODED_PASSWORD);
        user.setRole(Role.USER);
        user.setCompany(company);

        return user;
    }
}