package com.sched.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AiProductDataResponse {

    private String productName;
    private String category;
    private Long stockQuantity;
    private Long totalSold;
}