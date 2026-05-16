package com.sched.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandDataResponse {

    private String productName;
    private String category;
    private Double price;
    private Integer totalSold;
    private Integer month;
    private Integer stockQuantity;
}