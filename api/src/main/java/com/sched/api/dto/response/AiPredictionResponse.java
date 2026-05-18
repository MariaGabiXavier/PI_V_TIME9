package com.sched.api.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiPredictionResponse {

    private String productName;

    private String status;
    private String message;

    private Integer prediction7Days;
    private Integer prediction15Days;
    private Integer prediction30Days;

    private Long currentStock;

    private Integer recommendedRestock;

    private String alert;
}