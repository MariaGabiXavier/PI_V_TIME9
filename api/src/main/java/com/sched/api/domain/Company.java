package com.sched.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_sched")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Company {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String cnpj;

    @Column(nullable = false)
    private Boolean deleted = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}