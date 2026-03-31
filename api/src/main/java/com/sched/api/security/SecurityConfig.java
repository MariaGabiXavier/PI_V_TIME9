package com.sched.api.security;

import com.sched.api.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityFilter securityFilter) throws Exception {
        return http
                .csrf(csrf -> csrf.disable()) // Mantém desativado
                // ADICIONE ESTA LINHA ABAIXO PARA ATIVAR O CORS
                .cors(org.springframework.security.config.Customizer.withDefaults()) 
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // LIBERA O MÉTODO OPTIONS (PREFLIGHT DO SAFARI/CHROME)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() 
                        
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/company").permitAll()
                        
                        // Suas outras regras permanecem iguais
                        .requestMatchers(HttpMethod.POST, "/auth/user").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/user/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/user/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/company/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/company/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/company/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

//mudei essa parte
@Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        
        // Permite a origem do seu Live Server
        configuration.setAllowedOrigins(java.util.List.of("http://127.0.0.1:5500", "http://localhost:5500"));
        
        // Permite os métodos necessários
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // Permite todos os cabeçalhos
        configuration.setAllowedHeaders(java.util.List.of("*"));
        
        // Importante para o Safari aceitar a resposta
        configuration.setAllowCredentials(true);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}